from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Order, OrderItem
from menu.models import MenuItem
from .serializers import CartSerializer, OrderSerializer



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

        total_price = cart.total_price

        order = Order.objects.create(
            user=request.user,
            canteen=canteen,
            total_price=total_price,
            payment_method='CASH_ON_ARRIVAL',
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

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        serializer = OrderSerializer(order)
        return Response(serializer.data)


class VendorOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'VENDOR':
            return Response({"error": "Only vendors can access this."}, status=403)

        orders = Order.objects.filter(
            canteen__vendor=user
        ).select_related('user', 'canteen').prefetch_related('items__menu_item')

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class VendorOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    # Valid transitions: current status → allowed next statuses
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
        return Response(serializer.data)

