from django.contrib import admin
from django.urls import path, include
from orders.urls import order_urlpatterns, vendor_order_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('accounts.urls')),
    path('api/vendor/', include('menu.urls')),
    path('api/cart/', include('orders.urls')),
    path('api/orders/', include((order_urlpatterns, 'orders'))),
    path('api/vendor/', include((vendor_order_urlpatterns, 'vendor_orders'))),
]
