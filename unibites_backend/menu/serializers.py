from rest_framework import serializers
from .models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'canteen', 'name', 'description', 'price', 'is_available', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'canteen', 'image_url']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        if user.role == 'VENDOR' and hasattr(user, 'canteen_set'):
            validated_data['canteen'] = user.canteen_set.first()
        return super().create(validated_data)
