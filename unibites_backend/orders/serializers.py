from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
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



class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.SerializerMethodField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item_name', 'quantity', 'price', 'subtotal']

    def get_menu_item_name(self, obj):
        return obj.menu_item.name if obj.menu_item else 'Deleted item'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    canteen_name = serializers.CharField(source='canteen.name', read_only=True)
    user_info = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'canteen_name', 'user_info',
            'total_price', 'payment_method', 'status',
            'created_at', 'items',
        ]

    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'name': obj.user.full_name or obj.user.email,
            'email': obj.user.email,
            'phone': obj.user.phone or '—',
        }
