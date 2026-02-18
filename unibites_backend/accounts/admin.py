from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from .models import User, Canteen


class CanteenInline(admin.StackedInline):
    model = Canteen
    can_delete = False
    verbose_name_plural = 'Canteen (Assign Vendor to Canteen)'
    fk_name = 'vendor'
    extra = 0

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("email", "full_name",)

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    list_display = ("email", "full_name", "role", "is_email_verified", "is_active", "is_staff",)

    search_fields = ("email", "full_name", "phone")
    list_filter = ("role", "is_email_verified", "is_active", "is_staff")
    ordering = ("email",)

    readonly_fields = ("otp_code", "otp_expires_at", "last_login", "date_joined",)

    inlines = [CanteenInline]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Basic Information", {"fields": ("full_name", "phone", "role",)}),
        ("Account Status", {"fields": ("is_email_verified", "is_active", "is_staff", "is_superuser",)}),
        ("OTP (For Verification / Reset)", {"fields": ("otp_code", "otp_expires_at",)}),
        ("Important Dates", {"fields": ("last_login", "date_joined",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "role"),
        }),
    )

    def save_model(self, request, obj, form, change):
        if change:
            if 'password' in form.cleaned_data:
                password = form.cleaned_data.get('password')
                if password:
                    if not (password.startswith('pbkdf2_') or password.startswith('bcrypt') or password.startswith('argon2') or password.startswith('scrypt')):
                        obj.set_password(password)
        else:
            if 'password' in form.cleaned_data:
                password = form.cleaned_data.get('password')
                if password:
                    obj.set_password(password)
        super().save_model(request, obj, form, change)

@admin.register(Canteen)
class CanteenAdmin(admin.ModelAdmin):
    list_display = ("name", "vendor", "location", "rating", "is_active")
    list_filter = ("is_active", "vendor")
    search_fields = ("name", "location", "vendor__email", "vendor__full_name")
    autocomplete_fields = ["vendor"]
    ordering = ("name",)