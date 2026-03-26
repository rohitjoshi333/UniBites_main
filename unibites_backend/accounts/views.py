from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from .serializers import (
    CanteenSerializer,
    RegisterSerializer,
    VerifyOtpSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    BannerSerializer,
    ReviewSerializer,
)
from .models import User, Canteen, Banner, Review
from django.utils import timezone
from datetime import timedelta
import random
import cloudinary.uploader
from rest_framework import permissions
from rest_framework.parsers import MultiPartParser, FormParser
import csv
from django.http import HttpResponse


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


class ProfileView(APIView):
    """
    GET /api/profile/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(APIView):
    """
    PATCH /api/profile/update/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    POST /api/profile/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"message": "Password changed successfully."})
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadProfileImageView(APIView):
    """
    POST /api/profile/upload-image/
    Accepts multipart/form-data with 'image' file.
    Uploads to Cloudinary and saves the secure URL on the user's profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/profiles",
                public_id=f"user_{request.user.id}",
                overwrite=True,
                resource_type="image",
            )
            secure_url = result.get("secure_url")
            request.user.profile_image = secure_url
            request.user.save(update_fields=["profile_image"])
            return Response({"profile_image": secure_url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadCanteenImageView(APIView):
    """
    POST /api/vendor/canteen/upload-image/
    Vendor-only. Uploads canteen image to Cloudinary and saves the URL.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        if user.role != "VENDOR":
            return Response({"error": "Only vendors can upload canteen images."}, status=status.HTTP_403_FORBIDDEN)

        canteen = Canteen.objects.filter(vendor=user).first()
        if not canteen:
            return Response({"error": "No canteen assigned to this vendor."}, status=status.HTTP_404_NOT_FOUND)

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/canteens",
                public_id=f"canteen_{canteen.id}",
                overwrite=True,
                resource_type="image",
            )
            secure_url = result.get("secure_url")
            canteen.image_url = secure_url
            canteen.save(update_fields=["image_url"])
            return Response({"image_url": secure_url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VendorReportExportView(APIView):
    """
    GET /api/vendor/reports/export/?type=<orders|menu>
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "VENDOR":
            return Response({"error": "Only vendors can export reports."}, status=status.HTTP_403_FORBIDDEN)

        canteen = Canteen.objects.filter(vendor=user).first()
        if not canteen:
            return Response({"error": "No canteen assigned."}, status=status.HTTP_404_NOT_FOUND)

        report_type = request.GET.get('type')
        if not report_type:
            return Response({"error": "Type parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="vendor_report_{report_type}_{timezone.now().strftime("%Y%m%d")}.csv"'
        writer = csv.writer(response)

        if report_type == 'orders':
            from orders.models import Order
            writer.writerow(['Order ID', 'User Name', 'User Email', 'Items', 'Total Amount', 'Status', 'Date'])
            orders = Order.objects.filter(canteen=canteen).select_related('user').prefetch_related('items__menu_item').order_by('-created_at')
            for order in orders:
                items_str = ", ".join([f"{item.quantity}x {item.menu_item.name}" for item in order.items.all()])
                writer.writerow([
                    order.id,
                    order.user.full_name if order.user else 'Unknown',
                    order.user.email if order.user else 'Unknown',
                    items_str,
                    order.total_price,
                    order.status,
                    order.created_at.strftime("%Y-%m-%d %H:%M")
                ])

        elif report_type == 'menu':
            from menu.models import MenuItem
            writer.writerow(['Item ID', 'Name', 'Description', 'Price', 'Is Available'])
            items = MenuItem.objects.filter(canteen=canteen).order_by('name')
            for item in items:
                writer.writerow([
                    item.id,
                    item.name,
                    item.description,
                    item.price,
                    'Yes' if item.is_available else 'No'
                ])
        else:
            return Response({"error": "Invalid report type"}, status=status.HTTP_400_BAD_REQUEST)

        return response


class BannerListView(APIView):
    """
    GET /api/banners/ - Public/App view
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by("serial_number", "-created_at")
        serializer = BannerSerializer(banners, many=True)
        return Response(serializer.data)


class BannerViewSet(viewsets.ModelViewSet):
    """
    CRUD /api/admin/banners/ - Admin only
    """
    queryset = Banner.objects.all().order_by("serial_number", "-created_at")
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


class UploadBannerImageView(APIView):
    """
    POST /api/admin/banners/upload/ - Admin only
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file = request.data.get('image')
        if not file:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            upload_data = cloudinary.uploader.upload(file, folder="unibites/banners")
            return Response({"image_url": upload_data['secure_url']}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CanteenReviewListView(APIView):
    """
    GET /api/canteens/<canteen_id>/reviews/
    Returns all reviews for a specific canteen.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, canteen_id):
        print(f"DEBUG: Fetching reviews for canteen ID: {canteen_id}")
        reviews = Review.objects.filter(canteen_id=canteen_id).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)