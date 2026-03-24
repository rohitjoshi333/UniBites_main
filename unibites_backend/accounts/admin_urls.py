from django.urls import path
from .admin_views import (
    AdminDashboardView,
    AdminActivitiesView,
    AdminUserListView,
    AdminUserDetailView,
    AdminCreateUserView,
    AdminUserPasswordView,
    AdminCanteenListView,
    AdminCanteenDetailView,
    AdminMenuItemListView,
    AdminMenuItemDetailView,
    AdminReportExportView,
)

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view()),
    path("activities/", AdminActivitiesView.as_view()),
    path("reports/export/", AdminReportExportView.as_view()),
    path("users/", AdminUserListView.as_view()),
    path("canteens/", AdminCanteenListView.as_view()),
    path("canteens/<int:pk>/", AdminCanteenDetailView.as_view()),
    path("canteens/<int:canteen_id>/menu/", AdminMenuItemListView.as_view()),
    path("menu/<int:pk>/", AdminMenuItemDetailView.as_view()),
    path("users/create/", AdminCreateUserView.as_view()),
    path("users/<int:pk>/", AdminUserDetailView.as_view()),
    path("users/<int:pk>/password/", AdminUserPasswordView.as_view()),
]

