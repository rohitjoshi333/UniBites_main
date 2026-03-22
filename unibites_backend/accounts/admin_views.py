from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import User, Canteen
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from menu.models import MenuItem
from django.utils import timezone
from datetime import timedelta
import random
import cloudinary.uploader


class IsAdminUser(permissions.BasePermission):
    """Only allow users with ADMIN role."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/
    Returns stats + recent activities for admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_canteens = Canteen.objects.filter(is_active=True).count()
        total_food_items = MenuItem.objects.count()

        # Recent activities: last 10 menu items added
        recent_items = MenuItem.objects.select_related("canteen").order_by("-created_at")[:10]
        recent_activities = []
        for item in recent_items:
            recent_activities.append({
                "id": item.id,
                "description": f"{item.canteen.name} Added {item.name} to the menu",
                "canteen_name": item.canteen.name,
                "item_name": item.name,
                "created_at": item.created_at.isoformat(),
            })

        return Response({
            "total_users": total_users,
            "total_canteens": total_canteens,
            "total_food_items": total_food_items,
            "recent_activities": recent_activities,
        })


class AdminCanteenListView(APIView):
    """
    GET /api/admin/canteens/
    POST /api/admin/canteens/
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        canteens = Canteen.objects.all().order_by("name")
        data = []
        for c in canteens:
            data.append({
                "id": c.id,
                "name": c.name,
                "vendor_id": c.vendor_id,
                "vendor_name": c.vendor.full_name if c.vendor else None,
                "vendor_email": c.vendor.email if c.vendor else None,
                "image_url": c.image_url,
            })
        return Response(data)

    def post(self, request):
        name = request.data.get("name")
        vendor_id = request.data.get("vendor_id")
        
        if not name:
            return Response({"error": "Canteen name is required."}, status=status.HTTP_400_BAD_REQUEST)

        vendor = None
        if vendor_id:
            try:
                vendor = User.objects.get(pk=vendor_id, role="VENDOR")
            except User.DoesNotExist:
                return Response({"error": "Valid Vendor ID is required if assigning a vendor."}, status=status.HTTP_400_BAD_REQUEST)

        canteen = Canteen(name=name, vendor=vendor)
        canteen.save()

        # Handle Image Upload
        image_file = request.FILES.get('image')
        if image_file:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/canteens",
                public_id=f"canteen_{canteen.id}",
                overwrite=True,
                resource_type="image",
            )
            canteen.image_url = result.get("secure_url")
            canteen.save()

        return Response({
            "id": canteen.id,
            "name": canteen.name,
            "vendor_id": canteen.vendor_id,
            "vendor_name": canteen.vendor.full_name if canteen.vendor else None,
            "vendor_email": canteen.vendor.email if canteen.vendor else None,
            "image_url": canteen.image_url,
        }, status=status.HTTP_201_CREATED)


class AdminCanteenDetailView(APIView):
    """
    GET/PUT/DELETE /api/admin/canteens/<id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return Canteen.objects.get(pk=pk)
        except Canteen.DoesNotExist:
            return None

    def get(self, request, pk):
        canteen = self.get_object(pk)
        if not canteen:
            return Response({"error": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "id": canteen.id,
            "name": canteen.name,
            "vendor_id": canteen.vendor_id,
            "vendor_name": canteen.vendor.full_name if canteen.vendor else None,
            "vendor_email": canteen.vendor.email if canteen.vendor else None,
            "image_url": canteen.image_url,
        })

    def put(self, request, pk):
        canteen = self.get_object(pk)
        if not canteen:
            return Response({"error": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            canteen.name = request.data["name"]
        
        if "vendor_id" in request.data:
            vendor_id = request.data["vendor_id"]
            if vendor_id in ["", "null", None]:
                canteen.vendor = None
            else:
                try:
                    canteen.vendor = User.objects.get(pk=vendor_id, role="VENDOR")
                except User.DoesNotExist:
                    pass

        # Handle Image Upload
        image_file = request.FILES.get('image')
        if image_file:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/canteens",
                public_id=f"canteen_{canteen.id}",
                overwrite=True,
                resource_type="image",
            )
            canteen.image_url = result.get("secure_url")

        canteen.save()
        return Response({
            "id": canteen.id,
            "name": canteen.name,
            "vendor_id": canteen.vendor_id,
            "vendor_name": canteen.vendor.full_name if canteen.vendor else None,
            "vendor_email": canteen.vendor.email if canteen.vendor else None,
            "image_url": canteen.image_url,
        })

    def delete(self, request, pk):
        canteen = self.get_object(pk)
        if not canteen:
            return Response({"error": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)
        
        canteen.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminMenuItemListView(APIView):
    """
    GET /api/admin/canteens/<canteen_id>/menu/
    POST /api/admin/canteens/<canteen_id>/menu/
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, canteen_id):
        items = MenuItem.objects.filter(canteen_id=canteen_id).order_by("-created_at")
        from menu.serializers import MenuItemSerializer
        serializer = MenuItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request, canteen_id):
        try:
            canteen = Canteen.objects.get(pk=canteen_id)
        except Canteen.DoesNotExist:
            return Response({"error": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)
        
        name = request.data.get("name")
        price = request.data.get("price")
        if not name or not price:
            return Response({"error": "Name and price are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        item = MenuItem(
            canteen=canteen,
            name=name,
            description=request.data.get("description", ""),
            price=price,
            is_available=request.data.get("is_available", "true").lower() == "true",
        )
        item.save()

        # Handle Image Upload
        image_file = request.FILES.get('image')
        if image_file:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/menu",
                public_id=f"item_{item.id}",
                overwrite=True,
                resource_type="image",
            )
            item.image_url = result.get("secure_url")
            item.save()

        from menu.serializers import MenuItemSerializer
        return Response(MenuItemSerializer(item).data, status=status.HTTP_201_CREATED)


class AdminMenuItemDetailView(APIView):
    """
    GET/PUT/DELETE /api/admin/menu/<pk>/
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return MenuItem.objects.get(pk=pk)
        except MenuItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"error": "Menu item not found."}, status=status.HTTP_404_NOT_FOUND)
        
        from menu.serializers import MenuItemSerializer
        return Response(MenuItemSerializer(item).data)

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"error": "Menu item not found."}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            item.name = request.data["name"]
        if "description" in request.data:
            item.description = request.data["description"]
        if "price" in request.data:
            item.price = request.data["price"]
        if "is_available" in request.data:
            item.is_available = request.data["is_available"] in ["true", True, 1, "1"]

        # Handle Image Upload
        image_file = request.FILES.get('image')
        if image_file:
            result = cloudinary.uploader.upload(
                image_file,
                folder="unibites/menu",
                public_id=f"item_{item.id}",
                overwrite=True,
                resource_type="image",
            )
            item.image_url = result.get("secure_url")

        item.save()
        from menu.serializers import MenuItemSerializer
        return Response(MenuItemSerializer(item).data)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"error": "Menu item not found."}, status=status.HTTP_404_NOT_FOUND)
        
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserListView(APIView):
    """
    GET /api/admin/users/
    List all users with optional filters: ?role=USER&status=verified&search=...
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        # Filter by role
        role = request.query_params.get("role")
        if role:
            users = users.filter(role=role.upper())

        # Filter by verification status
        status_filter = request.query_params.get("status")
        if status_filter == "verified":
            users = users.filter(is_email_verified=True)
        elif status_filter == "unverified":
            users = users.filter(is_email_verified=False)

        # Search by name or email
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            users = users.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )

        data = []
        for user in users:
            data.append({
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_email_verified": user.is_email_verified,
                "is_active": user.is_active,
                "date_joined": user.date_joined.isoformat(),
            })

        return Response(data)


class AdminUserDetailView(APIView):
    """
    GET/PUT/DELETE /api/admin/users/<id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            "is_active": user.is_active,
            "date_joined": user.date_joined.isoformat(),
        })

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update allowed fields
        if "role" in request.data:
            user.role = request.data["role"]
        if "is_active" in request.data:
            user.is_active = request.data["is_active"]
        if "is_email_verified" in request.data:
            user.is_email_verified = request.data["is_email_verified"]
        if "full_name" in request.data:
            user.full_name = request.data["full_name"]
        if "phone" in request.data:
            user.phone = request.data["phone"]

        user.save()

        # Handle canteen assignment if role is VENDOR
        if user.role == "VENDOR" and "canteen_id" in request.data:
            canteen_id = request.data["canteen_id"]
            if canteen_id:
                try:
                    canteen = Canteen.objects.get(pk=canteen_id)
                    canteen.vendor = user
                    canteen.save()
                except Canteen.DoesNotExist:
                    pass
            else:
                # If canteen_id is null/empty, unassign vendor from their current canteen
                Canteen.objects.filter(vendor=user).update(vendor=None)

        return Response({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            "is_active": user.is_active,
            "date_joined": user.date_joined.isoformat(),
        })

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Don't let admin delete themselves
        if user.id == request.user.id:
            return Response({"error": "Cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"message": "User deleted."}, status=status.HTTP_204_NO_CONTENT)


class AdminCreateUserView(APIView):
    """
    POST /api/admin/users/create/
    Create a new user (admin can set any role).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        email = request.data.get("email")
        full_name = request.data.get("full_name")
        password = request.data.get("password")
        phone = request.data.get("phone")
        role = request.data.get("role", "USER")
        canteen_id = request.data.get("canteen_id")

        if not email or not full_name or not password:
            return Response(
                {"error": "email, full_name, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role,
            is_email_verified=True
        )
        user.set_password(password)
        user.save()

        # Assign canteen if role is VENDOR
        if role == "VENDOR" and canteen_id:
            try:
                canteen = Canteen.objects.get(pk=canteen_id)
                canteen.vendor = user
                canteen.save()
            except Canteen.DoesNotExist:
                pass

        return Response({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            "is_active": user.is_active,
            "date_joined": user.date_joined.isoformat(),
        }, status=status.HTTP_201_CREATED)

class AdminUserPasswordView(APIView):
    """
    PUT /api/admin/users/<id>/password/
    Admin endpoint to change a user's password.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({"message": f"Password updated for {user.full_name}."})

