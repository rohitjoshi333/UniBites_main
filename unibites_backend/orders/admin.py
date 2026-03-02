from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem

admin.site.register(Cart)
admin.site.register(CartItem)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'canteen', 'total_price', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'canteen')
    search_fields = ('user__email',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'menu_item', 'quantity', 'price')
