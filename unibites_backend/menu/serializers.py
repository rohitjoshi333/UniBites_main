from rest_framework import serializers
from .models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'canteen', 'name', 'description', 'price', 'is_available', 'created_at']
        read_only_fields = ['id', 'created_at', 'canteen']

    def create(self, validated_data):
        # Assign the canteen from the user's profile automatically
        request = self.context.get('request')
        user = request.user
        if user.role == 'VENDOR' and hasattr(user, 'canteen_set'):
            # Assuming One-to-One or taking the first one if multiple
            # But Canteen mode has `vendor` FK, so `user.canteen_set.first()`
            validated_data['canteen'] = user.canteen_set.first()
        return super().create(validated_data)
