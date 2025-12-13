from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ( "email", "full_name", "role", "is_email_verified", "is_active", "is_staff",)

    list_filter = ("role", "is_email_verified", "is_active", "is_staff",)

    search_fields = ("email", "full_name",)

    ordering = ("email",)

    readonly_fields = ("otp_code", "otp_expires_at", "last_login", "date_joined",)

    fieldsets = (
        ("Basic Information", {"fields": ("full_name", "email", "phone", "role",)}),

        ("Account Status", {"fields": ("is_email_verified", "is_active", "is_staff", "is_superuser",)}),
        
        ("Password", {"fields": ("password",)}),
         
        ("OTP (For Verification / Reset)", {"fields": ("otp_code", "otp_expires_at",)}),
        
        ("Important Dates", {"fields": ("last_login", "date_joined",)}),
    )
