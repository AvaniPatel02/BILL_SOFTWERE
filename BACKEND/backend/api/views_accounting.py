from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Invoice, Buyer, CompanyBill, OtherTransaction
from .serializers import InvoiceSerializer, BuyerSerializer, CompanyBillSerializer, OtherTransactionSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_list(request):
    """
    Return a list of unique accounts grouped by buyer_name, buyer_address, buyer_gst,
    including credits (Buyer + CompanyBill + OtherTransaction) and net amount.
    """
    invoices = Invoice.objects.filter(user=request.user)
    buyers = Buyer.objects.filter(user=request.user)
    company_bills = CompanyBill.objects.all()  # No user field, so include all
    other_transactions = OtherTransaction.objects.filter(user=request.user)

    # Collect all unique buyer keys from invoices, buyers, company bills, and other transactions
    buyer_keys = set()
    for inv in invoices:
        buyer_keys.add((inv.buyer_name, inv.buyer_address, inv.buyer_gst))
    for b in buyers:
        buyer_keys.add((b.name, "", ""))  # Buyer model may not have address/gst
    for cb in company_bills:
        buyer_keys.add((cb.company, "", ""))  # CompanyBill may not have address/gst
    for ot in other_transactions:
        buyer_keys.add((ot.type, "", ""))  # Use type as name

    accounts = {}
    for name, address, gst in buyer_keys:
        accounts[(name, address, gst)] = {
            "buyer_name": name,
            "buyer_address": address,
            "buyer_gst": gst,
            "invoices": [],
            "buyer_credits": [],
            "company_bill_credits": [],
            "other_transactions": [],
        }

    for inv in invoices:
        key = (inv.buyer_name, inv.buyer_address, inv.buyer_gst)
        if key in accounts:
            accounts[key]["invoices"].append(inv)
    for b in buyers:
        for key in accounts:
            if b.name == key[0]:
                accounts[key]["buyer_credits"].append(b)
    for cb in company_bills:
        for key in accounts:
            if cb.company == key[0]:
                accounts[key]["company_bill_credits"].append(cb)
    for ot in other_transactions:
        key = (ot.type, "", "")
        if key in accounts:
            accounts[key]["other_transactions"].append(ot)

    result = []
    for acc in accounts.values():
        total_debit = sum(float(inv.total_with_gst) for inv in acc["invoices"] if inv.total_with_gst)
        total_buyer_credit = sum(float(b.amount) for b in acc["buyer_credits"] if b.amount)
        total_companybill_credit = sum(float(cb.amount) for cb in acc["company_bill_credits"] if cb.amount)
        # OtherTransaction: sum by transaction_type
        total_other_credit = sum(float(ot.amount) for ot in acc["other_transactions"] if ot.transaction_type == "credit")
        total_other_debit = sum(float(ot.amount) for ot in acc["other_transactions"] if ot.transaction_type == "debit")
        total_credit = total_buyer_credit + total_companybill_credit + total_other_credit
        total_debit = total_debit + total_other_debit
        net_amount = total_debit - total_credit
        # Find the latest date among all transactions
        all_dates = (
            [inv.invoice_date for inv in acc["invoices"] if inv.invoice_date] +
            [b.date for b in acc["buyer_credits"] if b.date] +
            [cb.date for cb in acc["company_bill_credits"] if cb.date] +
            [ot.date for ot in acc["other_transactions"] if ot.date]
        )
        latest_date = max(all_dates) if all_dates else None
        result.append({
            "buyer_name": acc["buyer_name"],
            "buyer_address": acc["buyer_address"],
            "buyer_gst": acc["buyer_gst"],
            "total_debit": total_debit,
            "total_credit": total_credit,
            "net_amount": net_amount,
            "latest_date": latest_date,
            "invoice_count": len(acc["invoices"]),
            "invoices": InvoiceSerializer(acc["invoices"], many=True).data,
            "buyer_credits": BuyerSerializer(acc["buyer_credits"], many=True).data,
            "company_bill_credits": CompanyBillSerializer(acc["company_bill_credits"], many=True).data,
            "other_transactions": OtherTransactionSerializer(acc["other_transactions"], many=True).data,
        })
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_statement(request):
    """Return a ready-to-display account statement for a given account (by buyer_name, buyer_address, buyer_gst), with optional date filtering."""
    from datetime import datetime
    buyer_name = request.GET.get("buyer_name")
    buyer_address = request.GET.get("buyer_address")
    buyer_gst = request.GET.get("buyer_gst")
    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")

    invoices = Invoice.objects.filter(user=request.user, buyer_name=buyer_name, buyer_address=buyer_address, buyer_gst=buyer_gst).order_by("invoice_date")
    buyers = Buyer.objects.filter(user=request.user, name=buyer_name).order_by("date")
    company_bills = CompanyBill.objects.filter(company=buyer_name).order_by("date")
    other_transactions = OtherTransaction.objects.filter(user=request.user, type=buyer_name).order_by("date")

    # Merge, sort, and calculate running balance
    entries = []
    for inv in invoices:
        entries.append({
            "date": inv.invoice_date.strftime('%d-%m-%Y') if inv.invoice_date else '',
            "description": inv.invoice_number,
            "credit": 0,
            "debit": float(inv.total_with_gst) if inv.total_with_gst else 0,
            "type": "Invoice"
        })
    for dep in buyers:
        entries.append({
            "date": dep.date.strftime('%d-%m-%Y') if dep.date else '',
            "description": dep.notes or "Deposit",
            "credit": float(dep.amount) if dep.amount else 0,
            "debit": 0,
            "type": "Deposit"
        })
    for cb in company_bills:
        entries.append({
            "date": cb.date.strftime('%d-%m-%Y') if cb.date else '',
            "description": cb.notice or "Company Bill Credit",
            "credit": float(cb.amount) if cb.amount else 0,
            "debit": 0,
            "type": "Credit"
        })
    for ot in other_transactions:
        entries.append({
            "date": ot.date.strftime('%d-%m-%Y') if ot.date else '',
            "description": ot.notice or "Other",
            "credit": float(ot.amount) if ot.transaction_type == "credit" else 0,
            "debit": float(ot.amount) if ot.transaction_type == "debit" else 0,
            "type": "Other"
        })
    # Sort by date
    def parse_date(d):
        try:
            return datetime.strptime(d, "%d-%m-%Y")
        except Exception:
            return datetime(1900, 1, 1)
    entries.sort(key=lambda x: parse_date(x["date"]))

    # Filter by from_date and to_date
    if from_date:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        entries = [e for e in entries if parse_date(e["date"]) >= from_dt]
    if to_date:
        to_dt = datetime.strptime(to_date, "%Y-%m-%d")
        entries = [e for e in entries if parse_date(e["date"]) <= to_dt]

    # Calculate running balance
    balance = 0
    for entry in entries:
        balance += entry["credit"] - entry["debit"]
        entry["balance"] = balance

    total_credit = sum(e["credit"] for e in entries)
    total_debit = sum(e["debit"] for e in entries)

    return Response({
        "buyer_name": buyer_name,
        "buyer_gst": buyer_gst,
        "total_balance": balance,
        "total_credit": total_credit,
        "total_debit": total_debit,
        "statement": entries
    }) 