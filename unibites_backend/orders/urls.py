from django.urls import path
from .views import CartView, AddToCartView, UpdateCartItemView, RemoveCartItemView

urlpatterns = [
    path('', CartView.as_view()),
    path('add/', AddToCartView.as_view()),
    path('update/', UpdateCartItemView.as_view()),
    path('remove/<int:pk>/', RemoveCartItemView.as_view()),
]
