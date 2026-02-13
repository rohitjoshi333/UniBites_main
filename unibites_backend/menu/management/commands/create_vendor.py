from django.core.management.base import BaseCommand
from accounts.models import User, Canteen


class Command(BaseCommand):
    help = "Create a vendor user and optionally assign to a canteen"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--name", required=True, help="Full name of the vendor")
        parser.add_argument("--canteen", required=False, help="Canteen ID to assign")

    def handle(self, *args, **options):
        email = options["email"]
        password = options["password"]
        name = options["name"]
        canteen_id = options.get("canteen")

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            user.set_password(password)  # This HASHES the password
            user.role = "VENDOR"
            user.is_email_verified = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.WARNING(f"User {email} already exists. Updated password and role."))
        else:
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=name,
                role="VENDOR",
                is_email_verified=True,
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Vendor user created: {email}"))

        if canteen_id:
            try:
                canteen = Canteen.objects.get(id=canteen_id)
                canteen.vendor = user
                canteen.save()
                self.stdout.write(self.style.SUCCESS(f"Assigned to canteen: {canteen.name}"))
            except Canteen.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Canteen with ID {canteen_id} not found."))
