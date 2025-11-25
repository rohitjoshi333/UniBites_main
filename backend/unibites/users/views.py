from rest_framework import generics
from .serializer import UserSerializer
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            return Response({'message': 'Login successful'}, 
            status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED)