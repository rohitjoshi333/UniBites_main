from rest_framework import permissions

class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VENDOR'

class IsCanteenOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj is MenuItem. Check if the canteen belongs to the vendor.
        return obj.canteen.vendor == request.user
