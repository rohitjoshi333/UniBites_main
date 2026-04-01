from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import uuid
from datetime import datetime, timedelta
from .models import Cart, CartItem, Order, OrderItem
from menu.models import MenuItem
from .serializers import CartSerializer, OrderSerializer
from .esewa import generate_signature, verify_esewa_response

channel_layer = get_channel_layer()


def create_and_send_notification(user, title, message, notification_type, related_order_id=None):
    from accounts.models import Notification
    from accounts.serializers import NotificationSerializer
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_order_id=related_order_id
    )
    try:
        serializer = NotificationSerializer(notification)
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "notification",
                "data": serializer.data,
            },
        )
    except Exception as e:
        print(f"DEBUG: Failed to send WS notification: {e}")


def parse_and_validate_scheduled_time(scheduled_time_str):

    # Validates the scheduled_time from request data.
    
    if not scheduled_time_str:
        return None, None  # No scheduling requested — that's fine

    try:
        scheduled_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
        # Convert to UTC aware if naive
        if scheduled_time.tzinfo is None:
            scheduled_time = timezone.make_aware(scheduled_time)
    except (ValueError, TypeError):
        return None, "Invalid scheduled_time format. Use ISO 8601."

    now = timezone.now()
    min_time = now + timedelta(minutes=5)

    if scheduled_time < min_time:
        return None, "Scheduled time must be at least 5 minutes (testing ho hai guys chill :))"

    # Same-day check (in local time).
    local_now = timezone.localtime(now)
    local_scheduled = timezone.localtime(scheduled_time)
    if local_scheduled.date() != local_now.date():
        return None, "Scheduling is only allowed for today."

    return scheduled_time, None



class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        menu_item_id = request.data.get('menu_item_id')
        quantity = int(request.data.get('quantity', 1))

        if not menu_item_id or quantity < 1:
            return Response({"error": "Invalid item or quantity."}, status=400)

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
        except MenuItem.DoesNotExist:
            return Response({"error": "Menu item not found"}, status=404)

        cart, created = Cart.objects.get_or_create(user=user)

        first_item = cart.items.first()
        if first_item:
            current_canteen = first_item.menu_item.canteen
            if current_canteen != menu_item.canteen:
                return Response(
                    {"error": f"Cart contains items from {current_canteen.name}. Clear cart to order from {menu_item.canteen.name}."},
                    status=400
                )

        cart_item, created = CartItem.objects.get_or_create(cart=cart, menu_item=menu_item)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()

        return Response({"message": "Item added to cart"}, status=200)


class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity')

        if not cart_item_id or not quantity or int(quantity) < 1:
            return Response({"error": "Invalid data."}, status=400)

        cart = get_object_or_404(Cart, user=request.user)
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found in cart"}, status=404)

        cart_item.quantity = int(quantity)
        cart_item.save()
        return Response({"message": "Cart updated"})


class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        cart = get_object_or_404(Cart, user=request.user)
        try:
            cart_item = CartItem.objects.get(id=pk, cart=cart)
            cart_item.delete()
            return Response({"message": "Item removed"})
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)



class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.select_related('menu_item__canteen').all()

        if not cart_items.exists():
            return Response({"error": "Your cart is empty."}, status=400)

        canteen = cart.canteen
        if not canteen:
            return Response({"error": "Unable to determine canteen from cart."}, status=400)

        # Validate optional scheduled_time
        scheduled_time_str = request.data.get('scheduled_time')
        scheduled_time, err = parse_and_validate_scheduled_time(scheduled_time_str)
        if err:
            return Response({"error": err}, status=400)

        payment_method = request.data.get('payment_method', 'CASH_ON_ARRIVAL')
        total_price = cart.total_price

        order = Order.objects.create(
            user=request.user,
            canteen=canteen,
            total_price=total_price,
            payment_method=payment_method,
            scheduled_time=scheduled_time,
            status=Order.Status.PENDING,
        )

        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
            )

        # Clear the cart
        cart_items.delete()

        serializer = OrderSerializer(order)

        # Real-time: notify vendor dashboard
        try:
            async_to_sync(channel_layer.group_send)(
                f"vendor_{canteen.id}",
                {
                    "type": "order.update",
                    "data": {
                        "type": "new_order",
                        "order": serializer.data,
                    },
                },
            )
        except Exception:
            pass  # WebSocket push HTTP response always returns

        create_and_send_notification(
            user=request.user,
            title="Order Placed",
            message=f"Your order at {canteen.name} has been placed successfully.",
            notification_type="ORDER_STATUS",
            related_order_id=order.id
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items__menu_item')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        if order.user != request.user:
            return Response({"error": "You do not have permission to cancel this order."}, status=403)

        if order.status != Order.Status.PENDING:
            return Response({"error": "Only pending orders can be cancelled."}, status=400)

        if order.payment_method == 'ESEWA':
            return Response({"error": "Online paid orders cannot be cancelled directly. Please contact the canteen."}, status=400)

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        create_and_send_notification(
            user=request.user,
            title="Order Cancelled",
            message=f"Your order at {order.canteen.name} has been cancelled.",
            notification_type="ORDER_STATUS",
            related_order_id=order.id
        )

        serializer = OrderSerializer(order)
        return Response(serializer.data)


class RateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        if order.user != request.user:
            return Response({"error": "You do not have permission to rate this order."}, status=403)

        if order.status != Order.Status.COMPLETED:
            return Response({"error": "You can only rate completed orders."}, status=400)

        if order.is_rated:
            return Response({"error": "This order has already been rated."}, status=400)

        rating = request.data.get('rating')
        message = request.data.get('message')
        if not rating:
            return Response({"error": "Rating is required."}, status=400)

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except ValueError:
            return Response({"error": "Rating must be an integer between 1 and 5."}, status=400)

        from accounts.models import Review
        Review.objects.create(
            user=request.user,
            canteen=order.canteen,
            order=order,
            rating=rating,
            message=message
        )

        order.is_rated = True
        order.save(update_fields=['is_rated'])

        return Response({"message": "Rating submitted successfully.", "rating": rating}, status=status.HTTP_201_CREATED)


class VendorOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'VENDOR':
            return Response({"error": "Only vendors can access this."}, status=403)

        from django.db.models import Q
        
        # Vendors should not see eSewa orders that haven't been paid yet
        orders = Order.objects.filter(
            canteen__vendor=user
        ).exclude(
            Q(payment_method='ESEWA') & Q(payment_status=Order.PaymentStatus.PENDING_PAYMENT)
        ).select_related('user', 'canteen').prefetch_related('items__menu_item')

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class VendorOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    TRANSITIONS = {
        Order.Status.PENDING:    [Order.Status.ACCEPTED, Order.Status.REJECTED],
        Order.Status.ACCEPTED:   [Order.Status.PREPARING],
        Order.Status.PREPARING:  [Order.Status.READY],
        Order.Status.READY:      [Order.Status.COMPLETED],
        Order.Status.COMPLETED:  [],
        Order.Status.REJECTED:   [],
    }

    def patch(self, request, pk):
        user = request.user
        if user.role != 'VENDOR':
            return Response({"error": "Only vendors can update order status."}, status=403)

        order = get_object_or_404(Order, pk=pk)

        if order.canteen.vendor != user:
            return Response({"error": "You do not have permission to update this order."}, status=403)

        new_status = request.data.get('status')
        allowed = self.TRANSITIONS.get(order.status, [])

        if not new_status:
            return Response({"error": "Status field is required."}, status=400)

        if new_status not in allowed:
            if not allowed:
                return Response({"error": f"Order is already in final state: {order.status}."}, status=400)
            return Response(
                {"error": f"Cannot move from {order.status} to {new_status}. Allowed: {allowed}"},
                status=400
            )

        order.status = new_status
        order.save(update_fields=['status'])

        serializer = OrderSerializer(order)

        # Real-time: notify the customer
        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{order.user_id}",
                {
                    "type": "order.update",
                    "data": {
                        "type": "order_status_update",
                        "order_id": order.id,
                        "status": new_status,
                    },
                },
            )
        except Exception:
            pass  # WebSocket push HTTP response always returns

        create_and_send_notification(
            user=order.user,
            title="Order Status Updated",
            message=f"Your order at {order.canteen.name} is now '{new_status}'.",
            notification_type="ORDER_STATUS",
            related_order_id=order.id
        )

        return Response(serializer.data)


class EsewaInitiateView(APIView):

    # POST /api/orders/esewa/initiate/
    # Creates a pending eSewa order & returns the signed form parameters that the mobile app uses to redirect the user to eSewa's payment page

    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.select_related('menu_item__canteen').all()

        if not cart_items.exists():
            return Response({"error": "Your cart is empty."}, status=400)

        canteen = cart.canteen
        if not canteen:
            return Response({"error": "Unable to determine canteen from cart."}, status=400)

        total_price = cart.total_price
        transaction_uuid = f"unibites-{uuid.uuid4().hex[:16]}"

        # Validate optional scheduled_time
        scheduled_time_str = request.data.get('scheduled_time')
        scheduled_time, err = parse_and_validate_scheduled_time(scheduled_time_str)
        if err:
            return Response({"error": err}, status=400)

        # Create a pending-payment order
        order = Order.objects.create(
            user=request.user,
            canteen=canteen,
            total_price=total_price,
            payment_method='ESEWA',
            payment_status=Order.PaymentStatus.PENDING_PAYMENT,
            payment_ref_id=transaction_uuid,
            scheduled_time=scheduled_time,
            status=Order.Status.PENDING,
        )

        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
            )
        cart_items.delete()

        product_code = settings.ESEWA_PRODUCT_CODE
        total_amount_str = str(total_price)
        signature = generate_signature(total_amount_str, transaction_uuid, product_code)

        # Deep-link back into the app after payment
        success_url = "https://2cd1-2400-74e0-0-1371-6857-2f29-cb70-703c.ngrok-free.app/api/orders/esewa/verify/"
        failure_url = f"https://2cd1-2400-74e0-0-1371-6857-2f29-cb70-703c.ngrok-free.app/api/orders/esewa/verify/?status=failed&uuid={transaction_uuid}"

        return Response({
            "order_id": order.id,
            "esewa_url": settings.ESEWA_PAYMENT_URL,
            "form_params": {
                "amount": total_amount_str,
                "tax_amount": "0",
                "product_service_charge": "0",
                "product_delivery_charge": "0",
                "total_amount": total_amount_str,
                "transaction_uuid": transaction_uuid,
                "product_code": product_code,
                "success_url": success_url,
                "failure_url": failure_url,
                "signed_field_names": "total_amount,transaction_uuid,product_code",
                "signature": signature,
            }
        }, status=status.HTTP_201_CREATED)


from django.http import HttpResponse

def deep_link_redirect(url, order_id):
    msg_type = "PAYMENT_FAILED" if order_id == "failed" else "PAYMENT_SUCCESS"
    html = f"""
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirecting to UniBites...</title>
        <style>
          body {{ display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #f7f9fc; margin: 0; }}
          .loader {{ border: 4px solid #e2e8f0; border-top: 4px solid #60C271; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }}
          @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
          p {{ color: #64748B; }}
          a {{ color: #60C271; font-weight: bold; text-decoration: none; margin-top: 20px; }}
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Payment Processed</h2>
        <p>Returning you to the app...</p>
        <a href="{url}">Click here if nothing happens</a>
        <script>
          setTimeout(function() {{
            var msg = JSON.stringify({{ "type": "{msg_type}", "orderId": "{order_id}" }});
            if (window.ReactNativeWebView) {{
                window.ReactNativeWebView.postMessage(msg);
            }} else {{
                window.top.location.href = "{url}";
            }}
          }}, 500);
        </script>
      </body>
    </html>
    """
    return HttpResponse(html)

class EsewaVerifyView(APIView):

    # GET /api/orders/esewa/verify/?data=<base64>
    # Called by eSewa after a successful payment. Verifies HMAC & marks order as PAID & can be hit server to server or as a redirect target, then redirects to deep link.

    permission_classes = []

    def get(self, request):
        # Handle user cancellation / failure from eSewa
        if request.query_params.get('status') == 'failed':
            uuid_param = request.query_params.get('uuid')
            if uuid_param:
                Order.objects.filter(payment_ref_id=uuid_param, payment_status=Order.PaymentStatus.PENDING_PAYMENT).update(
                    payment_status=Order.PaymentStatus.FAILED,
                    status=Order.Status.CANCELLED
                )
            return deep_link_redirect("unibitesapp://payment-success?orderId=failed", "failed")

        encoded_data = request.query_params.get('data')
        if not encoded_data:
            return Response({"error": "Missing payment data."}, status=400)

        verified_data = verify_esewa_response(encoded_data)
        if not verified_data:
            return Response({"error": "Payment verification failed. Invalid signature."}, status=400)

        transaction_uuid = verified_data.get('transaction_uuid', '')
        esewa_status = verified_data.get('status', '')

        if esewa_status.upper() != 'COMPLETE':
            return Response({"error": f"Payment not completed. Status: {esewa_status}"}, status=400)

        try:
            order = Order.objects.get(payment_ref_id=transaction_uuid)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=404)

        if order.payment_status == Order.PaymentStatus.PAID:
            return deep_link_redirect(f"unibitesapp://payment-success?orderId={order.id}", order.id)

        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=['payment_status'])

        # Real-time notify vendor dashboard
        try:
            serializer = OrderSerializer(order)
            async_to_sync(channel_layer.group_send)(
                f"vendor_{order.canteen_id}",
                {
                    "type": "order.update",
                    "data": {
                        "type": "new_order",
                        "order": serializer.data,
                    },
                },
            )
        except Exception:
            pass  # WebSocket push

        create_and_send_notification(
            user=order.user,
            title="Payment Successful",
            message=f"Your payment for order #{order.id} was successful.",
            notification_type="PAYMENT",
            related_order_id=order.id
        )

        # Redirect to deep link so the mobile app picks it up
        return deep_link_redirect(f"unibitesapp://payment-success?orderId={order.id}", order.id)

