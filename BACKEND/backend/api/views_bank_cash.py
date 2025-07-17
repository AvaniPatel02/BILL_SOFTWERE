from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import BankAccount, CashEntry
from .serializers import BankAccountSerializer, CashEntrySerializer

# BANK ACCOUNTS

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bank_accounts_list_create(request):
    if request.method == 'GET':
        banks = BankAccount.objects.filter(user=request.user, is_deleted=False)
        serializer = BankAccountSerializer(banks, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BankAccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def bank_account_detail(request, pk):
    try:
        bank = BankAccount.objects.get(pk=pk, user=request.user)
    except BankAccount.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)

    if request.method == 'GET':
        serializer = BankAccountSerializer(bank)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = BankAccountSerializer(bank, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        bank.soft_delete()
        return Response({'message': 'Bank account soft deleted'}, status=204)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_accounts_deleted(request):
    banks = BankAccount.objects.filter(user=request.user, is_deleted=True)
    serializer = BankAccountSerializer(banks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bank_account_restore(request, pk):
    try:
        bank = BankAccount.objects.get(pk=pk, user=request.user, is_deleted=True)
    except BankAccount.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    bank.restore()
    return Response({'message': 'Bank account restored'}, status=200)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def bank_account_permanent_delete(request, pk):
    try:
        bank = BankAccount.objects.get(pk=pk, user=request.user, is_deleted=True)
    except BankAccount.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    bank.delete()
    return Response({'message': 'Bank account permanently deleted'}, status=204)

# CASH ENTRIES

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cash_entries_list_create(request):
    if request.method == 'GET':
        entries = CashEntry.objects.filter(user=request.user, is_deleted=False)
        serializer = CashEntrySerializer(entries, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = CashEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def cash_entry_detail(request, pk):
    try:
        entry = CashEntry.objects.get(pk=pk, user=request.user)
    except CashEntry.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)

    if request.method == 'GET':
        serializer = CashEntrySerializer(entry)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = CashEntrySerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        entry.soft_delete()
        return Response({'message': 'Cash entry soft deleted'}, status=204)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_entries_deleted(request):
    entries = CashEntry.objects.filter(user=request.user, is_deleted=True)
    serializer = CashEntrySerializer(entries, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cash_entry_restore(request, pk):
    try:
        entry = CashEntry.objects.get(pk=pk, user=request.user, is_deleted=True)
    except CashEntry.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    entry.restore()
    return Response({'message': 'Cash entry restored'}, status=200)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cash_entry_permanent_delete(request, pk):
    try:
        entry = CashEntry.objects.get(pk=pk, user=request.user, is_deleted=True)
    except CashEntry.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    entry.delete()
    return Response({'message': 'Cash entry permanently deleted'}, status=204) 