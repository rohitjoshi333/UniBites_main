from django.urls import path
from .views import (
    RegisterView,
    VerifyOtpView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    ResendOtpView,
    CanteenListView,
    VendorCanteenView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("verify-otp/", VerifyOtpView.as_view()),
    path("resend-otp/", ResendOtpView.as_view()),
    path("login/", LoginView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path("canteens/", CanteenListView.as_view()),
    path("vendor/canteen/", VendorCanteenView.as_view()),
]

