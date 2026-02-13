from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuItemViewSet, PublicMenuView

router = DefaultRouter()
router.register(r'menu', MenuItemViewSet, basename='menu')

urlpatterns = [
    path('', include(router.urls)),
    path('public/menu/<int:canteen_id>/', PublicMenuView.as_view({'get': 'list'}), name='public-menu'),
]

