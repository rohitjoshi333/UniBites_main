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
import csv
from django.http import HttpResponse
from django.db.models import Count, Sum, Q


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

        # Sales analytics
        from orders.models import Order
        from django.db.models import Sum, Count, Avg

        all_orders = Order.objects.all()
        completed_orders = all_orders.filter(status='COMPLETED')
        total_orders = all_orders.count()

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_sales = completed_orders.aggregate(total=Sum('total_price'))['total'] or 0
        monthly_sales = completed_orders.filter(created_at__gte=month_start).aggregate(total=Sum('total_price'))['total'] or 0
        today_sales = completed_orders.filter(created_at__gte=today_start).aggregate(total=Sum('total_price'))['total'] or 0
        avg_order_value = completed_orders.aggregate(avg=Avg('total_price'))['avg'] or 0

        # Orders today
        orders_today = all_orders.filter(created_at__gte=today_start).count()

        # Order status breakdown
        pending_orders = all_orders.filter(status__in=['PENDING', 'ACCEPTED', 'PREPARING', 'READY']).count()
        completed_count = completed_orders.count()
        rejected_count = all_orders.filter(status__in=['REJECTED', 'CANCELLED']).count()

        # Payment method breakdown
        esewa_orders = completed_orders.filter(payment_method='ESEWA').count()
        cash_orders = completed_orders.filter(payment_method='CASH_ON_ARRIVAL').count()
        esewa_revenue = completed_orders.filter(payment_method='ESEWA').aggregate(total=Sum('total_price'))['total'] or 0
        cash_revenue = completed_orders.filter(payment_method='CASH_ON_ARRIVAL').aggregate(total=Sum('total_price'))['total'] or 0

        # User breakdown
        total_customers = User.objects.filter(role='USER').count()
        total_vendors = User.objects.filter(role='VENDOR').count()
        total_admins = User.objects.filter(role='ADMIN').count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        unverified_users = User.objects.filter(is_email_verified=False).count()
        new_users_this_month = User.objects.filter(date_joined__gte=month_start).count()

        # Last 7 days daily sales
        daily_sales = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            amount = completed_orders.filter(
                created_at__gte=day_start, created_at__lt=day_end
            ).aggregate(total=Sum('total_price'))['total'] or 0
            day_orders = all_orders.filter(
                created_at__gte=day_start, created_at__lt=day_end
            ).count()
            daily_sales.append({
                "date": day_start.strftime('%b %d'),
                "amount": float(amount),
                "orders": day_orders,
            })

        # Per-canteen sales breakdown
        canteen_sales = []
        canteens = Canteen.objects.filter(is_active=True).order_by('name')
        for c in canteens:
            c_completed = completed_orders.filter(canteen=c)
            c_total = c_completed.aggregate(total=Sum('total_price'))['total'] or 0
            c_today = c_completed.filter(created_at__gte=today_start).aggregate(total=Sum('total_price'))['total'] or 0
            c_monthly = c_completed.filter(created_at__gte=month_start).aggregate(total=Sum('total_price'))['total'] or 0
            c_orders = c_completed.count()
            c_pending = all_orders.filter(canteen=c, status__in=['PENDING', 'ACCEPTED', 'PREPARING', 'READY']).count()
            c_menu_items = MenuItem.objects.filter(canteen=c).count()
            canteen_sales.append({
                "canteen_name": c.name,
                "total_sales": float(c_total),
                "today_sales": float(c_today),
                "monthly_sales": float(c_monthly),
                "total_orders": c_orders,
                "pending_orders": c_pending,
                "menu_items": c_menu_items,
                "rating": float(c.rating),
            })

        return Response({
            "total_users": total_users,
            "total_canteens": total_canteens,
            "total_food_items": total_food_items,
            "recent_activities": recent_activities,
            "total_orders": total_orders,
            "orders_today": orders_today,
            "total_sales": float(total_sales),
            "monthly_sales": float(monthly_sales),
            "today_sales": float(today_sales),
            "avg_order_value": float(avg_order_value),
            "pending_orders": pending_orders,
            "completed_orders": completed_count,
            "rejected_orders": rejected_count,
            "esewa_orders": esewa_orders,
            "cash_orders": cash_orders,
            "esewa_revenue": float(esewa_revenue),
            "cash_revenue": float(cash_revenue),
            "total_customers": total_customers,
            "total_vendors": total_vendors,
            "total_admins": total_admins,
            "verified_users": verified_users,
            "unverified_users": unverified_users,
            "new_users_this_month": new_users_this_month,
            "daily_sales": daily_sales,
            "canteen_sales": canteen_sales,
        })


class AdminActivitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        from orders.models import Order

        activities = []

        # All orders
        orders = Order.objects.select_related('user', 'canteen').order_by('-created_at')
        for o in orders:
            status_labels = {
                'PENDING': 'placed',
                'ACCEPTED': 'accepted',
                'PREPARING': 'is being prepared',
                'READY': 'is ready for pickup',
                'COMPLETED': 'completed',
                'REJECTED': 'rejected',
                'CANCELLED': 'cancelled',
            }
            label = status_labels.get(o.status, o.status.lower())
            activities.append({
                "type": "order",
                "description": f"Order #{o.id} {label} — Rs. {o.total_price} ({o.payment_method.replace('_', ' ').title()})",
                "detail": f"by {o.user.full_name} at {o.canteen.name}",
                "status": o.status,
                "timestamp": o.created_at.isoformat(),
            })

        # User registrations
        users = User.objects.order_by('-date_joined')
        for u in users:
            activities.append({
                "type": "user",
                "description": f"{u.full_name} registered as {u.role}",
                "detail": u.email,
                "status": "VERIFIED" if u.is_email_verified else "UNVERIFIED",
                "timestamp": u.date_joined.isoformat(),
            })

        # Menu items added
        menu_items = MenuItem.objects.select_related('canteen').order_by('-created_at')
        for item in menu_items:
            activities.append({
                "type": "menu",
                "description": f"{item.name} added to {item.canteen.name} menu",
                "detail": f"Rs. {item.price}",
                "status": "AVAILABLE" if item.is_available else "UNAVAILABLE",
                "timestamp": item.created_at.isoformat(),
            })

        # Sort all by timestamp descending
        activities.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response(activities)


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
                "location": c.location,
                "opening_time": c.opening_time,
                "closing_time": c.closing_time,
                "image_url": c.image_url,
            })
        return Response(data)

    def post(self, request):
        name = request.data.get("name")
        vendor_id = request.data.get("vendor_id")
        location = request.data.get("location", "")
        opening_time = request.data.get("opening_time", "")
        closing_time = request.data.get("closing_time", "")
        
        if not name:
            return Response({"error": "Canteen name is required."}, status=status.HTTP_400_BAD_REQUEST)

        vendor = None
        if vendor_id:
            try:
                vendor = User.objects.get(pk=vendor_id, role="VENDOR")
            except User.DoesNotExist:
                return Response({"error": "Valid Vendor ID is required if assigning a vendor."}, status=status.HTTP_400_BAD_REQUEST)

        canteen = Canteen(
            name=name, 
            vendor=vendor,
            location=location,
            opening_time=opening_time,
            closing_time=closing_time
        )
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
            "location": canteen.location,
            "opening_time": canteen.opening_time,
            "closing_time": canteen.closing_time,
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
            "location": canteen.location,
            "opening_time": canteen.opening_time,
            "closing_time": canteen.closing_time,
            "image_url": canteen.image_url,
        })

    def put(self, request, pk):
        canteen = self.get_object(pk)
        if not canteen:
            return Response({"error": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            canteen.name = request.data["name"]
        if "location" in request.data:
            canteen.location = request.data["location"]
        if "opening_time" in request.data:
            canteen.opening_time = request.data["opening_time"]
        if "closing_time" in request.data:
            canteen.closing_time = request.data["closing_time"]
        
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
            "location": canteen.location,
            "opening_time": canteen.opening_time,
            "closing_time": canteen.closing_time,
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
        if "email" in request.data:
            new_email = request.data["email"]
            if new_email != user.email:
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
                user.email = new_email

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

class AdminReportExportView(APIView):
    """
    GET /api/admin/reports/export/?type=<orders|users|canteens>
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        report_type = request.GET.get('type')
        if not report_type:
            return Response({"error": "Type parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="admin_report_{report_type}_{timezone.now().strftime("%Y%m%d")}.csv"'
        writer = csv.writer(response)

        if report_type == 'orders':
            from orders.models import Order
            writer.writerow(['Order ID', 'User', 'Canteen', 'Total Amount', 'Status', 'Date'])
            orders = Order.objects.all().select_related('user', 'canteen').order_by('-created_at')
            for order in orders:
                writer.writerow([
                    order.id,
                    order.user.full_name if order.user else 'Unknown',
                    order.canteen.name if order.canteen else 'Unknown',
                    order.total_price,
                    order.status,
                    order.created_at.strftime("%Y-%m-%d %H:%M")
                ])

        elif report_type == 'users':
            writer.writerow(['User ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'])
            users = User.objects.all().order_by('-date_joined')
            for u in users:
                writer.writerow([
                    u.id,
                    u.full_name,
                    u.email,
                    u.role,
                    'Active' if u.is_active else 'Inactive',
                    u.date_joined.strftime("%Y-%m-%d")
                ])

        elif report_type == 'canteens':
            from orders.models import Order
            writer.writerow(['Canteen ID', 'Name', 'Vendor', 'Total Sales', 'Pending Orders', 'Completed Orders'])
            canteens = Canteen.objects.all().select_related('vendor')
            for c in canteens:
                sales = Order.objects.filter(canteen=c, status='COMPLETED').aggregate(total=Sum('total_price'))['total'] or 0
                pending = Order.objects.filter(canteen=c, status='PENDING').count()
                completed = Order.objects.filter(canteen=c, status='COMPLETED').count()
                writer.writerow([
                    c.id,
                    c.name,
                    c.vendor.full_name if c.vendor else 'Unassigned',
                    sales,
                    pending,
                    completed
                ])
        else:
            return Response({"error": "Invalid report type"}, status=status.HTTP_400_BAD_REQUEST)

        return response
