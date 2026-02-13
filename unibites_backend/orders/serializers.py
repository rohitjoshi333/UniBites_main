from rest_framework import serializers
from .models import Cart, CartItem
from menu.serializers import MenuItemSerializer

class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'menu_item', 'quantity', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.ReadOnlyField()
    canteen = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'canteen', 'items', 'total_price', 'updated_at']

    def get_canteen(self, obj):
        if obj.canteen:
            return {
                "id": obj.canteen.id,
                "name": obj.canteen.name
            }
        return None
