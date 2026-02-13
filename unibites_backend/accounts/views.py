from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    CanteenSerializer,
    RegisterSerializer,
    VerifyOtpSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .models import User, Canteen
from django.utils import timezone
from datetime import timedelta
import random

class RegisterView(APIView):
    """
    POST /api/auth/register/
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "Registered. OTP sent to email."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOtpView(APIView):
    """
    POST /api/auth/verify-otp/
    """

    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Email verified successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    POST /api/auth/login/
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    """

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If email exists, OTP is sent."})

        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        user.otp_expires_at = timezone.now() + timedelta(seconds=120)
        user.save()

        print("DEBUG reset OTP for", user.email, "=", otp)

        return Response({"message": "OTP sent to email for password reset."})

class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    """

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        new_password = serializer.validated_data["new_password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email or OTP."}, status=400)

        if user.otp_code != otp or (user.otp_expires_at and user.otp_expires_at < timezone.now()):
            return Response({"error": "Invalid or expired OTP."}, status=400)

        user.set_password(new_password)
        user.otp_code = None
        user.otp_expires_at = None
        user.save()

        return Response({"message": "Password changed successfully."})
    
class ResendOtpView(APIView):
    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_email_verified:
            return Response(
                {"detail": "Email already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Note: invalidate old OTP FIRST
        user.otp_code = None
        user.otp_expires_at = None
        user.save(update_fields=["otp_code", "otp_expires_at"])

        # Generate NEW OTP
        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=5)
        user.save(update_fields=["otp_code", "otp_expires_at"])

        print("DEBUG NEW OTP for", user.email, "=", otp)

        return Response({"message": "OTP resent successfully."})

class CanteenListView(APIView):
    """
    GET /api/canteens/
    """
    def get(self, request):
        canteens = Canteen.objects.filter(is_active=True)
        serializer = CanteenSerializer(canteens, many=True)
        return Response(serializer.data)

from rest_framework import permissions
class VendorCanteenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "VENDOR":
            return Response({"error": "Not a vendor"}, status=403)
        
        canteen = Canteen.objects.filter(vendor=user).first()
        if not canteen:
            return Response({"error": "No canteen assigned"}, status=404)
        
        serializer = CanteenSerializer(canteen)
        return Response(serializer.data)