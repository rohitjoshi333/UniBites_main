from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveCartItemView,
    PlaceOrderView,
    MyOrdersView,
    CancelOrderView,
    VendorOrdersView,
    VendorOrderStatusView,
)


cart_urlpatterns = [
    path('', CartView.as_view()),
    path('add/', AddToCartView.as_view()),
    path('update/', UpdateCartItemView.as_view()),
    path('remove/<int:pk>/', RemoveCartItemView.as_view()),
]


order_urlpatterns = [
    path('place/', PlaceOrderView.as_view()),
    path('my-orders/', MyOrdersView.as_view()),
    path('<int:pk>/cancel/', CancelOrderView.as_view()),
]


vendor_order_urlpatterns = [
    path('orders/', VendorOrdersView.as_view()),
    path('orders/<int:pk>/status/', VendorOrderStatusView.as_view()),
]


urlpatterns = cart_urlpatterns
