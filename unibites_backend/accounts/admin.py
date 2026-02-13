from django.contrib import admin
from .models import User, Canteen


class CanteenInline(admin.StackedInline):
    model = Canteen
    can_delete = False
    verbose_name_plural = 'Canteen (Assign Vendor to Canteen)'
    fk_name = 'vendor'
    extra = 0  # Do not show extra empty forms by default

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    
    list_display = ( "email", "full_name", "role", "is_email_verified", "is_active", "is_staff",)

    search_fields = ("email", "full_name", "phone")
    list_filter = ("role", "is_email_verified", "is_active", "is_staff")
    ordering = ("email",)

    readonly_fields = ("otp_code", "otp_expires_at", "last_login", "date_joined",)

    inlines = [CanteenInline]

    fieldsets = (
        ("Basic Information", {"fields": ("full_name", "email", "phone", "role",)}),

        ("Account Status", {"fields": ("is_email_verified", "is_active", "is_staff", "is_superuser",)}),
        
        ("Password", {"fields": ("password",)}),
         
        ("OTP (For Verification / Reset)", {"fields": ("otp_code", "otp_expires_at",)}),
        
        ("Important Dates", {"fields": ("last_login", "date_joined",)}),
    )

@admin.register(Canteen)
class CanteenAdmin(admin.ModelAdmin):
    list_display = ("name", "vendor", "location", "rating", "is_active")
    list_filter = ("is_active", "vendor")
    search_fields = ("name", "location", "vendor__email", "vendor__full_name")
    autocomplete_fields = ["vendor"]
    ordering = ("name",)