from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import CompanyBill, BuyerBill, Salary, OtherTransaction, Invoice, Employee, EmployeeActionHistory, OtherType, BankAccount, CashEntry
from .serializers import CompanyBillSerializer, BuyerBillSerializer, SalarySerializer, OtherTransactionSerializer, OtherTypeSerializer
from django.utils import timezone
from rest_framework import status
from decimal import Decimal

# Utility to log employee actions

def log_employee_action(employee, action, details=""):
    EmployeeActionHistory.objects.create(
        employee=employee,
        action=action,
        details=details
    )

# CompanyBill CRUD
class CompanyBillListCreateView(generics.ListCreateAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        company_bill = serializer.save()
        amount = Decimal(str(company_bill.amount))
        if company_bill.payment_type == 'Banking' and company_bill.bank:
            bank = BankAccount.objects.filter(bank_name=company_bill.bank, is_deleted=False).first()
            if bank:
                bank.amount += amount
                bank.save()
        elif company_bill.payment_type == 'Cash':
            cash = CashEntry.objects.filter(user=self.request.user).order_by('-date').first()
            if cash:
                cash.amount += amount
                cash.save()

class CompanyBillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [permissions.AllowAny]

# BuyerBill CRUD
class BuyerBillListCreateView(generics.ListCreateAPIView):
    queryset = BuyerBill.objects.all()
    serializer_class = BuyerBillSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        buyer_bill = serializer.save()
        amount = Decimal(str(buyer_bill.amount))
        if buyer_bill.payment_type == 'Banking' and buyer_bill.bank:
            bank = BankAccount.objects.filter(bank_name=buyer_bill.bank, is_deleted=False).first()
            if bank:
                bank.amount -= amount
                bank.save()
        elif buyer_bill.payment_type == 'Cash':
            cash = CashEntry.objects.filter(user=self.request.user).order_by('-date').first()
            if cash:
                cash.amount -= amount
                cash.save()

class BuyerBillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BuyerBill.objects.all()
    serializer_class = BuyerBillSerializer
    permission_classes = [permissions.AllowAny]

# Salary CRUD
class SalaryListCreateView(generics.ListCreateAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        salary = serializer.save()
        amount = Decimal(str(salary.amount))
        if salary.payment_type == 'Banking' and salary.bank:
            bank = BankAccount.objects.filter(bank_name=salary.bank, is_deleted=False).first()
            if bank:
                bank.amount -= amount
                bank.save()
        elif salary.payment_type == 'Cash':
            cash = CashEntry.objects.filter(user=self.request.user).order_by('-date').first()
            if cash:
                cash.amount -= amount
                cash.save()

class SalaryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [permissions.AllowAny]

# OtherTransaction CRUD
class OtherTransactionListCreateView(generics.ListCreateAPIView):
    queryset = OtherTransaction.objects.all()
    serializer_class = OtherTransactionSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        other = serializer.save(user=self.request.user)
        amount = Decimal(str(other.amount))
        if other.payment_type == 'Banking' and other.bank:
            bank = BankAccount.objects.filter(bank_name=other.bank, is_deleted=False).first()
            if bank:
                if other.transaction_type == 'credit':
                    bank.amount += amount
                else:
                    bank.amount -= amount
                bank.save()
        elif other.payment_type == 'Cash':
            cash = CashEntry.objects.filter(user=self.request.user).order_by('-date').first()
            if cash:
                if other.transaction_type == 'credit':
                    cash.amount += amount
                else:
                    cash.amount -= amount
                cash.save()

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

@api_view(['GET', 'POST'])
def other_types(request):
    if request.method == 'GET':
        types = OtherType.objects.all()
        serializer = OtherTypeSerializer(types, many=True)
        return Response({'types': [t['type'] for t in serializer.data]})
    elif request.method == 'POST':
        serializer = OtherTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_cash_transactions(request):
    """
    Returns all transactions (CompanyBill, BuyerBill, Salary, OtherTransaction) for a given bank or for cash.
    Query params:
      - type: 'bank', 'cash', or 'all'
      - name: <bank_name> (required if type='bank')
    """
    ttype = request.GET.get('type', 'all')
    bank_name = request.GET.get('name', None)
    user = request.user
    transactions = []

    if ttype in ['all', 'bank']:
        # CompanyBill (credit)
        cb_qs = CompanyBill.objects.all()
        if ttype == 'bank':
            if bank_name:
                cb_qs = cb_qs.filter(payment_type='Banking', bank=bank_name)
            else:
                cb_qs = cb_qs.filter(payment_type='Banking')
        elif ttype == 'all':
            cb_qs = cb_qs.filter(payment_type='Banking')
        for cb in cb_qs:
            transactions.append({
                'type': 'CompanyBill',
                'date': cb.date,
                'amount': float(cb.amount),
                'credit': True,
                'debit': False,
                'description': cb.notice or '',
                'bank': cb.bank,
                'details': cb.company,
            })
        # BuyerBill (debit)
        bb_qs = BuyerBill.objects.all()
        if ttype == 'bank':
            if bank_name:
                bb_qs = bb_qs.filter(payment_type='Banking', bank=bank_name)
            else:
                bb_qs = bb_qs.filter(payment_type='Banking')
        elif ttype == 'all':
            bb_qs = bb_qs.filter(payment_type='Banking')
        for bb in bb_qs:
            transactions.append({
                'type': 'BuyerBill',
                'date': bb.date,
                'amount': float(bb.amount),
                'credit': False,
                'debit': True,
                'description': bb.notice or '',
                'bank': bb.bank,
                'details': bb.name,
            })
        # Salary (debit)
        sal_qs = Salary.objects.all()
        if ttype == 'bank':
            if bank_name:
                sal_qs = sal_qs.filter(payment_type='Banking', bank=bank_name)
            else:
                sal_qs = sal_qs.filter(payment_type='Banking')
        elif ttype == 'all':
            sal_qs = sal_qs.filter(payment_type='Banking')
        for sal in sal_qs:
            transactions.append({
                'type': 'Salary',
                'date': sal.date,
                'amount': float(sal.amount),
                'credit': False,
                'debit': True,
                'description': '',
                'bank': sal.bank,
                'details': sal.name,
            })
        # OtherTransaction (credit/debit)
        ot_qs = OtherTransaction.objects.all()
        if ttype == 'bank':
            if bank_name:
                ot_qs = ot_qs.filter(payment_type='Banking', bank=bank_name)
            else:
                ot_qs = ot_qs.filter(payment_type='Banking')
        elif ttype == 'all':
            ot_qs = ot_qs.filter(payment_type='Banking')
        for ot in ot_qs:
            transactions.append({
                'type': 'Other',
                'date': ot.date,
                'amount': float(ot.amount),
                'credit': ot.transaction_type == 'credit',
                'debit': ot.transaction_type == 'debit',
                'description': ot.notice or '',
                'bank': ot.bank,
                'details': ot.type,
            })
    if ttype in ['all', 'cash']:
        # CompanyBill (credit)
        cb_qs = CompanyBill.objects.filter(payment_type='Cash')
        for cb in cb_qs:
            transactions.append({
                'type': 'CompanyBill',
                'date': cb.date,
                'amount': float(cb.amount),
                'credit': True,
                'debit': False,
                'description': cb.notice or '',
                'bank': None,
                'details': cb.company,  # <-- add this line
            })
        # BuyerBill (debit)
        bb_qs = BuyerBill.objects.filter(payment_type='Cash')
        for bb in bb_qs:
            transactions.append({
                'type': 'BuyerBill',
                'date': bb.date,
                'amount': float(bb.amount),
                'credit': False,
                'debit': True,
                'description': bb.notice or '',
                'bank': None,
                'details': bb.name,  # <-- add this line
            })
        # Salary (debit)
        sal_qs = Salary.objects.filter(payment_type='Cash')
        for sal in sal_qs:
            transactions.append({
                'type': 'Salary',
                'date': sal.date,
                'amount': float(sal.amount),
                'credit': False,
                'debit': True,
                'description': '',
                'bank': None,
                'details': sal.name,  # <-- add this line
            })
        # OtherTransaction (credit/debit)
        ot_qs = OtherTransaction.objects.filter(payment_type='Cash')
        for ot in ot_qs:
            transactions.append({
                'type': 'Other',
                'date': ot.date,
                'amount': float(ot.amount),
                'credit': ot.transaction_type == 'credit',
                'debit': ot.transaction_type == 'debit',
                'description': ot.notice or '',
                'bank': None,
                'details': ot.type,  # <-- add this line (or ot.partner_name, ot.bank_name as needed)
            })
    # Sort by date descending
    transactions.sort(key=lambda x: str(x['date']), reverse=True)
    return Response(transactions) 