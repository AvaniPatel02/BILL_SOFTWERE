from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import CompanyBill, Buyer, Salary, OtherTransaction, BankAccount, CashEntry, EmployeeActionHistory, Invoice, OtherType
from .serializers import CompanyBillSerializer, BuyerSerializer, SalarySerializer, OtherTransactionSerializer, OtherTypeSerializer
from django.utils import timezone
from rest_framework import status
from decimal import Decimal

# Utility to log employee actions
def log_employee_action(employee, action):
    EmployeeActionHistory.objects.create(
        employee=employee,
        action=action
    )

# CompanyBill CRUD
class CompanyBillListCreateView(generics.ListCreateAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

class CompanyBillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CompanyBill.objects.all()
    serializer_class = CompanyBillSerializer
    permission_classes = [IsAuthenticated]

# Salary CRUD
class SalaryListCreateView(generics.ListCreateAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

class SalaryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]

# Buyer CRUD
class BuyerListCreateView(generics.ListCreateAPIView):
    serializer_class = BuyerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Buyer.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BuyerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BuyerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Include Buyer records that either belong to the current user OR have no user (from banking entries)
        return Buyer.objects.filter(Q(user=self.request.user) | Q(user__isnull=True))

# OtherTransaction CRUD
class OtherTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = OtherTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OtherTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OtherTransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OtherTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OtherTransaction.objects.filter(user=self.request.user)

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
@permission_classes([IsAuthenticated])
def other_types(request):
    if request.method == 'GET':
        # Get default types
        default_types = ["Partner", "Loan", "Unsecure Loan", "Fixed Assets", "Assets", "Expense"]
        
        # Get custom types from OtherType model for this user
        custom_types = OtherType.objects.filter(user=request.user).values_list('type_name', flat=True)
        
        # Combine default and custom types
        all_types = list(default_types) + list(custom_types)
        
        return Response({'types': all_types})
    elif request.method == 'POST':
        # Save new custom type
        type_name = request.data.get('type_name')
        if not type_name:
            return Response({'error': 'type_name is required'}, status=400)
        
        # Check if type already exists
        existing_type = OtherType.objects.filter(user=request.user, type_name=type_name).first()
        if existing_type:
            return Response({'message': 'Type already exists'}, status=200)
        
        # Create new type
        serializer = OtherTypeSerializer(data={'type_name': type_name})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unique_other_names(request):
    """Get unique names from OtherTransaction grouped by type"""
    other_names = OtherTransaction.objects.filter(
        user=request.user, 
        name__isnull=False, 
        name__gt=''
    ).values_list('name', flat=True).distinct()
    return Response({'other_names': list(other_names)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_other_names_by_type(request, type_name):
    """Get names for a specific type from OtherTransaction"""
    names = OtherTransaction.objects.filter(
        user=request.user, 
        type=type_name,
        name__isnull=False, 
        name__gt=''
    ).values_list('name', flat=True).distinct()
    return Response({'names': list(names)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_cash_transactions(request):
    """
    Returns all transactions (CompanyBill, Buyer, Salary, OtherTransaction) for a given bank or for cash.
    Query params:
      - type: 'bank', 'cash', or 'all'
      - name: <bank_name> (required if type='bank')
    """
    try:
        ttype = request.GET.get('type', 'all')
        bank_name = request.GET.get('name', None)
        user = request.user
        transactions = []

        # Add opening balance for bank
        if ttype in ['all', 'bank'] and bank_name:
            opening = BankAccount.objects.filter(user=user, bank_name=bank_name, is_opening_balance=True, is_deleted=False).first()
            if opening:
                transactions.append({
                    'id': opening.id,
                    'type': 'OpeningBalance',
                    'date': None,  # BankAccount doesn't have date field
                    'amount': float(opening.amount),
                    'credit': True,
                    'debit': False,
                    'description': 'Opening Balance',
                    'bank': bank_name,
                    'details': 'Opening Balance',
                })
        
        # Add opening balance for cash
        if ttype in ['all', 'cash']:
            opening = CashEntry.objects.filter(user=user, is_opening_balance=True, is_deleted=False).first()
            if opening:
                transactions.append({
                    'id': opening.id,
                    'type': 'OpeningBalance',
                    'date': opening.date,
                    'amount': float(opening.amount),
                    'credit': True,
                    'debit': False,
                    'description': 'Opening Balance',
                    'bank': None,
                    'details': 'Opening Balance',
                })

        if ttype in ['all', 'bank']:
            # CompanyBill (credit)
            cb_qs = CompanyBill.objects.all()  # CompanyBill doesn't have user field
            if ttype == 'bank':
                if bank_name:
                    cb_qs = cb_qs.filter(payment_type='Bank', bank=bank_name)
                else:
                    cb_qs = cb_qs.filter(payment_type='Bank')
            elif ttype == 'all':
                cb_qs = cb_qs.all()  # Show all CompanyBill transactions for 'all' type
            for cb in cb_qs:
                transactions.append({
                    'id': cb.id,
                    'type': 'CompanyBill',
                    'date': cb.date,
                    'amount': float(cb.amount),
                    'credit': True,
                    'debit': False,
                    'description': cb.notice or cb.company,  # Use notice if available, otherwise company name
                    'bank': cb.bank,
                    'payment_type': cb.payment_type,  # Add payment_type field
                    'details': 'CompanyBill',  # Show transaction type in details column
                })
            # Buyer (debit) - Buyer model has nullable user field
            bb_qs = Buyer.objects.filter(user__isnull=True)  # Only get records without user (from banking entries)
            if ttype == 'bank':
                if bank_name:
                    bb_qs = bb_qs.filter(payment_type='Bank', bank=bank_name)
                else:
                    bb_qs = bb_qs.filter(payment_type='Bank')
            elif ttype == 'all':
                bb_qs = bb_qs.all()  # Show all Buyer transactions for 'all' type
            for bb in bb_qs:
                transactions.append({
                    'id': bb.id,
                    'type': 'Buyer',
                    'date': bb.date,
                    'amount': float(bb.amount),
                    'credit': False,
                    'debit': True,
                    'description': bb.notes or bb.name,  # Use notes if available, otherwise buyer name
                    'bank': bb.bank,
                    'payment_type': bb.payment_type,  # Add payment_type field
                    'details': 'Buyer',  # Show transaction type in details column
                })
            # Salary (debit)
            sal_qs = Salary.objects.all()  # Salary doesn't have user field
            if ttype == 'bank':
                if bank_name:
                    sal_qs = sal_qs.filter(payment_type='Bank', bank=bank_name)
                else:
                    sal_qs = sal_qs.filter(payment_type='Bank')
            elif ttype == 'all':
                sal_qs = sal_qs.all()  # Show all Salary transactions for 'all' type
            for sal in sal_qs:
                transactions.append({
                    'id': sal.id,
                    'type': 'Salary',
                    'date': sal.date,
                    'amount': float(sal.amount),
                    'credit': False,
                    'debit': True,
                    'description': sal.name,  # Salary model only has name field
                    'bank': sal.bank,
                    'payment_type': sal.payment_type,  # Add payment_type field
                    'details': 'Salary',  # Show transaction type in details column
                })
            # OtherTransaction (credit/debit)
            ot_qs = OtherTransaction.objects.filter(user=user)  # OtherTransaction has user field
            if ttype == 'bank':
                if bank_name:
                    ot_qs = ot_qs.filter(payment_type='Bank', bank=bank_name)
                else:
                    ot_qs = ot_qs.filter(payment_type='Bank')
            elif ttype == 'all':
                ot_qs = ot_qs.all()  # Show all OtherTransaction transactions for 'all' type
            for ot in ot_qs:
                transactions.append({
                    'id': ot.id,
                    'type': 'Other',
                    'date': ot.date,
                    'amount': float(ot.amount),
                    'credit': ot.transaction_type == 'credit',
                    'debit': ot.transaction_type == 'debit',
                    'description': ot.name or ot.notice or '',  # Use name if available, otherwise notice
                    'bank': ot.bank,
                    'payment_type': ot.payment_type,  # Add payment_type field
                    'transaction_type': ot.transaction_type,  # Add transaction_type field
                    'details': ot.type,  # Keep showing type in details column
                })
        if ttype in ['all', 'cash']:
            # CompanyBill (credit)
            cb_qs = CompanyBill.objects.filter(payment_type='Cash')  # CompanyBill doesn't have user field
            for cb in cb_qs:
                transactions.append({
                    'id': cb.id,
                    'type': 'CompanyBill',
                    'date': cb.date,
                    'amount': float(cb.amount),
                    'credit': True,
                    'debit': False,
                    'description': cb.notice or cb.company,  # Use notice if available, otherwise company name
                    'bank': None,
                    'payment_type': cb.payment_type,  # Add payment_type field
                    'details': 'CompanyBill',  # Show transaction type in details column
                })
            # Buyer (debit) - Buyer model has nullable user field
            bb_qs = Buyer.objects.filter(payment_type='Cash', user__isnull=True)  # Only get records without user
            for bb in bb_qs:
                transactions.append({
                    'id': bb.id,
                    'type': 'Buyer',
                    'date': bb.date,
                    'amount': float(bb.amount),
                    'credit': False,
                    'debit': True,
                    'description': bb.notes or bb.name,  # Use notes if available, otherwise buyer name
                    'bank': None,
                    'payment_type': bb.payment_type,  # Add payment_type field
                    'details': 'Buyer',  # Show transaction type in details column
                })
            # Salary (debit)
            sal_qs = Salary.objects.filter(payment_type='Cash')  # Salary doesn't have user field
            for sal in sal_qs:
                transactions.append({
                    'id': sal.id,
                    'type': 'Salary',
                    'date': sal.date,
                    'amount': float(sal.amount),
                    'credit': False,
                    'debit': True,
                    'description': sal.name,  # Salary model only has name field
                    'bank': None,
                    'payment_type': sal.payment_type,  # Add payment_type field
                    'details': 'Salary',  # Show transaction type in details column
                })
            # OtherTransaction (credit/debit)
            ot_qs = OtherTransaction.objects.filter(user=user, payment_type='Cash')  # OtherTransaction has user field
            for ot in ot_qs:
                transactions.append({
                    'id': ot.id,
                    'type': 'Other',
                    'date': ot.date,
                    'amount': float(ot.amount),
                    'credit': ot.transaction_type == 'credit',
                    'debit': ot.transaction_type == 'debit',
                    'description': ot.name or ot.notice or '',  # Use name if available, otherwise notice
                    'bank': None,
                    'payment_type': ot.payment_type,  # Add payment_type field
                    'transaction_type': ot.transaction_type,  # Add transaction_type field
                    'details': ot.type,  # Keep showing type in details column
                })
        # Sort by date descending
        transactions.sort(key=lambda x: str(x['date']) if x['date'] else '', reverse=True)
        return Response(transactions)
    except Exception as e:
        import traceback
        print(f"Error in bank_cash_transactions: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calculate_bank_totals(request, bank_name):
    """Calculate total credit, debit, and net amount for a specific bank"""
    from django.db.models import Sum, Q
    from decimal import Decimal
    
    # Get all transactions for this bank
    company_bills = CompanyBill.objects.filter(
        payment_type='Bank', 
        bank=bank_name
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    buyer_bills = Buyer.objects.filter(
        payment_type='Bank', 
        bank=bank_name
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    salaries = Salary.objects.filter(
        payment_type='Bank', 
        bank=bank_name
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    other_credits = OtherTransaction.objects.filter(
        payment_type='Bank',
        bank=bank_name,
        transaction_type='credit'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    other_debits = OtherTransaction.objects.filter(
        payment_type='Bank',
        bank=bank_name,
        transaction_type='debit'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    total_credit = company_bills + other_credits
    total_debit = buyer_bills + salaries + other_debits
    net_amount = total_credit - total_debit
    
    return Response({
        'totalCredit': float(total_credit),
        'totalDebit': float(total_debit),
        'netAmount': float(net_amount)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calculate_cash_totals(request):
    """Calculate total credit, debit, and net amount for all cash transactions"""
    from django.db.models import Sum, Q
    from decimal import Decimal
    
    # Get all cash transactions
    company_bills = CompanyBill.objects.filter(
        payment_type='Cash'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    buyer_bills = Buyer.objects.filter(
        payment_type='Cash'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    salaries = Salary.objects.filter(
        payment_type='Cash'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    other_credits = OtherTransaction.objects.filter(
        payment_type='Cash',
        transaction_type='credit'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    other_debits = OtherTransaction.objects.filter(
        payment_type='Cash',
        transaction_type='debit'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    total_credit = company_bills + other_credits
    total_debit = buyer_bills + salaries + other_debits
    net_amount = total_credit - total_debit
    
    return Response({
        'totalCredit': float(total_credit),
        'totalDebit': float(total_debit),
        'netAmount': float(net_amount)
    }) 