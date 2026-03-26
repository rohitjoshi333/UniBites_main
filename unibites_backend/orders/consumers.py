import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer


class OrderConsumer(AsyncWebsocketConsumer):

    # WebSocket consumer for real-time order updates.

    async def connect(self):
        print(f"DEBUG: WS connect attempt. Scope: {self.scope['query_string']}")
        user = await self._authenticate()
        if user is None:
            print("DEBUG: WS authentication failed")
            await self.close(code=4001)
            return

        self.user = user
        self.groups = []
        print(f"DEBUG: WS authenticated user: {user.email} (ID: {user.id}, Role: {user.role})")

        if user.role == 'VENDOR':
            canteen_id = await self._get_vendor_canteen_id(user)
            print(f"DEBUG: Vendor canteen ID: {canteen_id}")
            if canteen_id:
                group = f"vendor_{canteen_id}"
                self.groups.append(group)
                await self.channel_layer.group_add(group, self.channel_name)
        else:
            group = f"user_{user.id}"
            self.groups.append(group)
            await self.channel_layer.group_add(group, self.channel_name)

        print(f"DEBUG: WS accepting connection. Groups: {self.groups}")
        await self.accept()

    async def disconnect(self, close_code):
        print(f"DEBUG: WS disconnect. Code: {close_code}")
        for group in getattr(self, 'groups', []):
            await self.channel_layer.group_discard(group, self.channel_name)

    # Receive a message forwarded from a channel group
    async def order_update(self, event):
        from django.core.serializers.json import DjangoJSONEncoder
        await self.send(text_data=json.dumps(event['data'], cls=DjangoJSONEncoder))

    # helpers

    async def _authenticate(self):
        """Validate JWT from query string and return the User, or None."""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token_list = params.get('token', [])
            if not token_list:
                print("DEBUG: No token in query string")
                return None
            
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(token_list[0])
            user_id = token['user_id']
            return await self._get_user(user_id)
        except Exception as e:
            print(f"DEBUG: Auth exception: {e}")
            return None

    @staticmethod
    async def _get_user(user_id):
        from channels.db import database_sync_to_async
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        @database_sync_to_async
        def fetch():
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None
        return await fetch()

    @staticmethod
    async def _get_vendor_canteen_id(user):
        from channels.db import database_sync_to_async
        from accounts.models import Canteen

        @database_sync_to_async
        def fetch():
            try:
                canteen = Canteen.objects.filter(vendor=user).first()
                return canteen.id if canteen else None
            except Exception as e:
                print(f"DEBUG: Error fetching canteen: {e}")
                return None

        return await fetch()
