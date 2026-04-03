from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import User, Canteen, Banner, Review, Notification
import random
from .utils import send_otp_email

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "title", "description", "image_url", "serial_number", "is_active", "created_at"]
        read_only_fields = ["created_at"]

class RegisterSerializer(serializers.ModelSerializer):
    # extra field only for input
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["full_name", "email", "phone", "password", "password2", "role"]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate_email(self, value):
        # check @islingtoncollege.edu.np
        if not value.endswith("@islingtoncollege.edu.np"):
            raise serializers.ValidationError(
                "Use your college email (@islingtoncollege.edu.np)."
            )
        return value
    
    def validate_phone(self, value):
        
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        
        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be 10 digits long.")
        
        if not value.startswith("98") and not value.startswith("97"):
            raise serializers.ValidationError("Enter a Valid Phone number.")
        return value
    
    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def create(self, validated_data):
        validated_data.pop("password2")  # we don't save this
        password = validated_data.pop("password")

        # create user
        user = User(**validated_data)
        user.set_password(password)  # hash password

        # generate OTP
        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=1)
        user.is_email_verified = False

        user.save()

        # Send OTP via email
        send_otp_email(user.email, otp)
        print("DEBUG OTP for", user.email, "=", otp)  # Keep for local testing if needed

        return user

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        if not user.otp_code:
            raise serializers.ValidationError("OTP invalid or already used.")

        # Comparison (only latest OTP works)
        if user.otp_code != data["otp"].strip():
            raise serializers.ValidationError("Invalid OTP.")

        # Expiry check
        if user.otp_expires_at and user.otp_expires_at < timezone.now():
            raise serializers.ValidationError("OTP expired. Please resend.")

        data["user"] = user
        return data

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.is_email_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        user.save()
        return user

from rest_framework_simplejwt.tokens import RefreshToken

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data["email"]
        password = data["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_email_verified and user.role == "USER":
            raise serializers.ValidationError("Please verify your email with OTP first.")

        # create JWT tokens
        refresh = RefreshToken.for_user(user)
        data["access"] = str(refresh.access_token)
        data["refresh"] = str(refresh)
        data["role"] = user.role
        data["full_name"] = user.full_name
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField()
    new_password2 = serializers.CharField()

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        
        try:
            user = User.objects.get(email=data["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email.")

        if user.check_password(data["new_password"]):
            raise serializers.ValidationError("New password must be different from the old password.")
        
        if user.otp_code != data["otp"]:
            raise serializers.ValidationError("Invalid OTP.")
        
        if user.otp_expires_at and user.otp_expires_at < timezone.now():
            raise serializers.ValidationError("OTP has expired.")
        return data

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user_name", "rating", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

class CanteenSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.full_name', read_only=True)
    vendor_email = serializers.EmailField(source='vendor.email', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Canteen
        fields = [
            "id",
            "name",
            "vendor_name",
            "vendor_email",
            "location",
            "opening_time",
            "closing_time",
            "rating",
            "total_items",
            "image_url",
        ]

    def get_total_items(self, obj):
        return obj.menu_items.filter(is_available=True).count()
        
class ProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='get_role_display')

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "role",
            "is_email_verified",
            "date_joined",
            "profile_image",
        ]
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone"]

    def validate_phone(self, value):
        if not value:
            return value
            
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        
        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be 10 digits long.")
        
        if not value.startswith("98") and not value.startswith("97"):
            raise serializers.ValidationError("Enter a valid phone number (starting with 98 or 97).")
        return value
    
    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Full Name cannot be empty.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")
        
        if data["old_password"] == data["new_password"]:
            raise serializers.ValidationError("New password cannot be the same as the old password.")
            
        return data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "related_order_id",
            "is_read",
            "created_at"
        ]
        read_only_fields = fields
