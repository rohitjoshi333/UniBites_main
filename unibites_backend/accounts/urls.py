from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    VerifyOtpView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    ResendOtpView,
    CanteenListView,
    VendorCanteenView,
    ProfileView,
    UpdateProfileView,
    ChangePasswordView,
    UploadProfileImageView,
    UploadCanteenImageView,
    VendorReportExportView,
    BannerListView,
    BannerViewSet,
    UploadBannerImageView,
    CanteenReviewListView,
    NotificationListView,
    NotificationMarkReadView,
)

router = DefaultRouter()
router.register(r'admin/banners', BannerViewSet, basename='admin-banners')

urlpatterns = [
    path("canteens/<int:canteen_id>/reviews/", CanteenReviewListView.as_view()),
    path("register/", RegisterView.as_view()),
    path("verify-otp/", VerifyOtpView.as_view()),
    path("resend-otp/", ResendOtpView.as_view()),
    path("login/", LoginView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path("canteens/", CanteenListView.as_view()),
    path("vendor/canteen/", VendorCanteenView.as_view()),
    path("vendor/canteen/upload-image/", UploadCanteenImageView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("profile/update/", UpdateProfileView.as_view()),
    path("profile/change-password/", ChangePasswordView.as_view()),
    path("profile/upload-image/", UploadProfileImageView.as_view()),
    path("vendor/reports/export/", VendorReportExportView.as_view()),
    path("banners/", BannerListView.as_view()),
    path("admin/banners/upload/", UploadBannerImageView.as_view()),
    path("notifications/", NotificationListView.as_view()),
    path("notifications/mark-read/", NotificationMarkReadView.as_view()),
    path("", include(router.urls)),
]
