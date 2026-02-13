from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from menu.models import MenuItem
from .serializers import CartSerializer

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
        # if user.role != 'USER':
        #      return Response({"error": "Only students/staff can order."}, status=403)

        menu_item_id = request.data.get('menu_item_id')
        quantity = int(request.data.get('quantity', 1))

        if not menu_item_id or quantity < 1:
            return Response({"error": "Invalid item or quantity."}, status=400)

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
        except MenuItem.DoesNotExist:
            return Response({"error": "Menu item not found"}, status=404)

        cart, created = Cart.objects.get_or_create(user=user)

        # Business Rule: Single Canteen
        # existing items
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

