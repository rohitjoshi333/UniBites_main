from rest_framework import viewsets, permissions
from .models import MenuItem, Canteen
from .serializers import MenuItemSerializer
from .permissions import IsVendor, IsCanteenOwner
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        # Only return items belonging to the vendor's canteen
        user = self.request.user
        if user.role == "VENDOR":
            return MenuItem.objects.filter(canteen__vendor=user).order_by("-created_at")
        return MenuItem.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        canteen = Canteen.objects.filter(vendor=user).first()
        if canteen:
            # Check if image is provided
            if 'image' not in self.request.data and 'image' not in self.request.FILES:
                # Image is optional in model but good to check if we wanted to enforce it
                pass 
            serializer.save(canteen=canteen)
        else:
            raise PermissionDenied("No canteen assigned to this vendor.")

class PublicMenuView(viewsets.ReadOnlyModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        canteen_id = self.kwargs.get('canteen_id')
        if canteen_id:
            return MenuItem.objects.filter(canteen_id=canteen_id, is_available=True).order_by('name')
        return MenuItem.objects.none()
