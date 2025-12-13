from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import User, Canteen
import random

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

        # In real app: email lai kei kaso gari hami eta set garney xam tesko lagi ajai tutorial haru hernu parney hunxa guys haru peace :)
        print("DEBUG OTP for", user.email, "=", otp)

        return user

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        if user.otp_code != data["otp"]:
            raise serializers.ValidationError("Wrong OTP.")

        if user.otp_expires_at and user.otp_expires_at < timezone.now():
            raise serializers.ValidationError("OTP expired. Please register again.")

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
        return data

class CanteenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Canteen
        fields = [
            "id",
            "name",
            "location",
            "opening_time",
            "closing_time",
            "rating",
            "total_items",
        ]
        
