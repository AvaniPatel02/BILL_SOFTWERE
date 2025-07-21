from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import CompanyBill, BuyerBill, Salary, OtherTransaction, Invoice
from .serializers import CompanyBillSerializer, BuyerBillSerializer, SalarySerializer, OtherTransactionSerializer

# CompanyBill CRUD
class CompanyBillListCreateView(generics.ListCreateAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [permissions.AllowAny]

class CompanyBillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [permissions.AllowAny]

# BuyerBill CRUD
class BuyerBillListCreateView(generics.ListCreateAPIView):
    queryset = BuyerBill.objects.all()
    serializer_class = BuyerBillSerializer
    permission_classes = [permissions.AllowAny]

class BuyerBillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BuyerBill.objects.all()
    serializer_class = BuyerBillSerializer
    permission_classes = [permissions.AllowAny]

# Salary CRUD
class SalaryListCreateView(generics.ListCreateAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [permissions.AllowAny]

class SalaryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [permissions.AllowAny]

# OtherTransaction CRUD
class OtherTransactionListCreateView(generics.ListCreateAPIView):
    queryset = OtherTransaction.objects.all()
    serializer_class = OtherTransactionSerializer
    permission_classes = [permissions.AllowAny]

class OtherTransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OtherTransaction.objects.all()
    serializer_class = OtherTransactionSerializer
    permission_classes = [permissions.AllowAny]

# New endpoints for company bill form
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unique_buyer_names(request):
    """Get unique buyer names from invoices for the current user"""
    try:
        # Get unique buyer names from invoices for the current user
        buyer_names = Invoice.objects.filter(
            user=request.user
        ).values_list('buyer_name', flat=True).distinct().order_by('buyer_name')
        
        return Response({
            'buyer_names': list(buyer_names)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoices_by_buyer(request, buyer_name):
    """Get invoices for a specific buyer name"""
    try:
        # Decode the buyer name from URL
        from urllib.parse import unquote
        decoded_buyer_name = unquote(buyer_name)
        
        # Get invoices for the specific buyer
        invoices = Invoice.objects.filter(
            user=request.user,
            buyer_name=decoded_buyer_name
        ).values('id', 'invoice_number', 'invoice_date', 'total_with_gst').order_by('-invoice_date')
        
        return Response({
            'invoices': list(invoices)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500) 