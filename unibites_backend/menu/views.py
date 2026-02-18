from rest_framework import viewsets, permissions
from .models import MenuItem, Canteen
from .serializers import MenuItemSerializer
from .permissions import IsVendor, IsCanteenOwner
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import cloudinary.uploader


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == "VENDOR":
            return MenuItem.objects.filter(canteen__vendor=user).order_by("-created_at")
        return MenuItem.objects.none()

    def _upload_image_if_present(self, request, item_id=None):
        """Upload image to Cloudinary if present in request. Returns secure_url or None."""
        image_file = request.FILES.get('image')
        if not image_file:
            return None
        public_id = f"item_{item_id}" if item_id else None
        result = cloudinary.uploader.upload(
            image_file,
            folder="unibites/menu",
            public_id=public_id,
            overwrite=True,
            resource_type="image",
        )
        return result.get("secure_url")

    def perform_create(self, serializer):
        user = self.request.user
        canteen = Canteen.objects.filter(vendor=user).first()
        if not canteen:
            raise PermissionDenied("No canteen assigned to this vendor.")

        # Save first to get an ID, then upload image
        instance = serializer.save(canteen=canteen)
        image_url = self._upload_image_if_present(self.request, item_id=instance.id)
        if image_url:
            instance.image_url = image_url
            instance.save(update_fields=["image_url"])

    def perform_update(self, serializer):
        instance = serializer.save()
        image_url = self._upload_image_if_present(self.request, item_id=instance.id)
        if image_url:
            instance.image_url = image_url
            instance.save(update_fields=["image_url"])


class PublicMenuView(viewsets.ReadOnlyModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        canteen_id = self.kwargs.get('canteen_id')
        if canteen_id:
            return MenuItem.objects.filter(canteen_id=canteen_id, is_available=True).order_by('name')
        return MenuItem.objects.none()
