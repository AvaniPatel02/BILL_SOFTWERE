from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Buyer
from .serializers import BuyerSerializer
from django.utils import timezone

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def buyer_list_create(request):
    if request.method == 'GET':
        buyers = Buyer.objects.filter(user=request.user).order_by('-created_at')
        serializer = BuyerSerializer(buyers, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BuyerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_buyer_names(request):
    buyers = Buyer.objects.filter(user=request.user).values_list('name', flat=True).distinct()
    return Response({'buyer_names': sorted(set(buyers))})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_buyer_name(request):
    name = request.data.get('name')
    if not name:
        return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
    # Check if already exists
    if Buyer.objects.filter(user=request.user, name=name).exists():
        return Response({'message': 'Buyer already exists'}, status=status.HTTP_200_OK)
    # Create with minimal fields (fill others as needed)
    buyer = Buyer.objects.create(
        user=request.user,
        name=name,
        date=request.data.get('date') or timezone.now().date(),
        amount=request.data.get('amount') or 0,
        notes=request.data.get('notes', ''),
        payment_type=request.data.get('payment_type', 'Cash')
    )
    return Response(BuyerSerializer(buyer).data, status=status.HTTP_201_CREATED) 