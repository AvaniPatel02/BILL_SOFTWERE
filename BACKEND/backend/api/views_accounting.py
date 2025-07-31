from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Invoice, Buyer, CompanyBill, OtherTransaction
from .serializers import InvoiceSerializer, BuyerSerializer, CompanyBillSerializer, OtherTransactionSerializer
from collections import defaultdict

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_list(request):
    """
    Return a list of unique accounts grouped by buyer_name, buyer_address, buyer_gst,
    including credits (Buyer + CompanyBill + OtherTransaction) and net amount.
    Shows only one entry per person with their total calculated balance.
    """
    invoices = Invoice.objects.filter(user=request.user)
    buyers = Buyer.objects.filter(user=request.user)
    company_bills = CompanyBill.objects.all()  # No user field, so include all
    other_transactions = OtherTransaction.objects.filter(user=request.user)

    # Group all transactions by buyer_name to calculate total balance per person
    person_balances = {}
    
    # Process invoices (debits)
    for inv in invoices:
        buyer_name = inv.buyer_name.strip()
        if buyer_name not in person_balances:
            person_balances[buyer_name] = {
                "buyer_name": buyer_name,
                "buyer_address": inv.buyer_address,
                "buyer_gst": inv.buyer_gst,
                "total_debit": 0,
                "total_credit": 0,
                "invoice_debit": 0,  # Track invoice debits separately
                "other_debit": 0,    # Track other debits separately
                "latest_date": None,
                "latest_transaction": None
            }
        person_balances[buyer_name]["total_debit"] += float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))
        person_balances[buyer_name]["invoice_debit"] += float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))  # Track as invoice debit
        if not person_balances[buyer_name]["latest_date"] or (inv.invoice_date and inv.invoice_date > person_balances[buyer_name]["latest_date"]):
            person_balances[buyer_name]["latest_date"] = inv.invoice_date
            person_balances[buyer_name]["latest_transaction"] = {
                "type": "Invoice",
                "amount": float(inv.total_with_gst) if inv.total_with_gst else 0,
                "date": inv.invoice_date,
                "note": inv.remark or "-"
            }
    
    # Process buyer credits
    for b in buyers:
        buyer_name = b.name.strip()
        if buyer_name not in person_balances:
            person_balances[buyer_name] = {
                "buyer_name": buyer_name,
                "buyer_address": "",
                "buyer_gst": "",
                "total_debit": 0,
                "total_credit": 0,
                "invoice_debit": 0,  # Track invoice debits separately
                "other_debit": 0,    # Track other debits separately
                "latest_date": None,
                "latest_transaction": None
            }
        person_balances[buyer_name]["total_credit"] += float(b.amount) if b.amount else 0
        if not person_balances[buyer_name]["latest_date"] or (b.date and b.date > person_balances[buyer_name]["latest_date"]):
            person_balances[buyer_name]["latest_date"] = b.date
            person_balances[buyer_name]["latest_transaction"] = {
                "type": "Buyer",
                "amount": float(b.amount) if b.amount else 0,
                "date": b.date,
                "note": b.notes or "-"
            }
    
    # Process company bills (credits)
    for cb in company_bills:
        company_name = cb.company.strip()
        if company_name not in person_balances:
            person_balances[company_name] = {
                "buyer_name": company_name,
                "buyer_address": "",
                "buyer_gst": "",
                "total_debit": 0,
                "total_credit": 0,
                "invoice_debit": 0,  # Track invoice debits separately
                "other_debit": 0,    # Track other debits separately
                "latest_date": None,
                "latest_transaction": None
            }
        person_balances[company_name]["total_credit"] += float(cb.amount) if cb.amount else 0
        if not person_balances[company_name]["latest_date"] or (cb.date and cb.date > person_balances[company_name]["latest_date"]):
            person_balances[company_name]["latest_date"] = cb.date
            person_balances[company_name]["latest_transaction"] = {
                "type": "Company Bill",
                "amount": float(cb.amount) if cb.amount else 0,
                "date": cb.date,
                "note": cb.notice or "-"
            }
    
    # Process other transactions
    for ot in other_transactions:
        # Use name if available, otherwise use type
        display_name = ot.name if ot.name else ot.type
        type_name = ot.type.strip()
        
        if display_name not in person_balances:
            person_balances[display_name] = {
                "buyer_name": display_name,
                "buyer_address": "",
                "buyer_gst": "",
                "total_debit": 0,
                "total_credit": 0,
                "invoice_debit": 0,  # Track invoice debits separately
                "other_debit": 0,    # Track other debits separately
                "latest_date": None,
                "latest_transaction": None
            }
        
        if ot.transaction_type == "credit":
            person_balances[display_name]["total_credit"] += float(ot.amount) if ot.amount else 0
        else:
            person_balances[display_name]["total_debit"] += float(ot.amount) if ot.amount else 0
            person_balances[display_name]["other_debit"] += float(ot.amount) if ot.amount else 0  # Track as other debit
            
        if not person_balances[display_name]["latest_date"] or (ot.date and ot.date > person_balances[display_name]["latest_date"]):
            person_balances[display_name]["latest_date"] = ot.date
            person_balances[display_name]["latest_transaction"] = {
                "type": "Other",
                "amount": float(ot.amount) if ot.amount else 0,
                "date": ot.date,
                "note": ot.notice or "-"
            }
    
    # Calculate net amounts and prepare result
    result = []
    for person_data in person_balances.values():
        net_amount = person_data["total_debit"] - person_data["total_credit"]
        person_data["net_amount"] = net_amount
        
        # Determine the primary transaction type
        # Check if this person has actual invoice transactions vs other transactions
        if person_data["invoice_debit"] > 0:
            primary_type = "Invoice"
        elif person_data["other_debit"] > 0 or person_data["total_credit"] > 0:
            primary_type = person_data["latest_transaction"]["type"] if person_data["latest_transaction"] else "Other"
        else:
            primary_type = "Mixed"
        
        result.append({
            "buyer_name": person_data["buyer_name"],
            "buyer_address": person_data["buyer_address"],
            "buyer_gst": person_data["buyer_gst"],
            "total_debit": person_data["total_debit"],
            "total_credit": person_data["total_credit"],
            "net_amount": net_amount,
            "latest_date": person_data["latest_date"],
            "latest_transaction": person_data["latest_transaction"],
            "primary_type": primary_type
        })
    
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_statement(request):
    """Return a ready-to-display account statement for a given account (by buyer_name, buyer_address, buyer_gst), with optional date filtering."""
    from datetime import datetime
    from collections import defaultdict
    
    buyer_name = request.GET.get("buyer_name")
    buyer_address = request.GET.get("buyer_address")
    buyer_gst = request.GET.get("buyer_gst")
    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")

    # Get all transactions for this buyer
    invoices = Invoice.objects.filter(user=request.user, buyer_name=buyer_name, buyer_address=buyer_address, buyer_gst=buyer_gst).order_by("invoice_date")
    buyers = Buyer.objects.filter(user=request.user, name=buyer_name).order_by("date")
    company_bills = CompanyBill.objects.filter(company=buyer_name).order_by("date")
    # Fix: Filter OtherTransaction by name field, not type field
    other_transactions = OtherTransaction.objects.filter(user=request.user, name=buyer_name).order_by("date")
    
    # Fallback: If no transactions found by name, also check by type (for backward compatibility)
    if not other_transactions.exists():
        other_transactions = OtherTransaction.objects.filter(user=request.user, type=buyer_name).order_by("date")

    # Handle duplicates - keep only latest for same date and notes
    entries = []
    
    # Handle invoice duplicates
    invoice_groups = defaultdict(list)
    for inv in invoices:
        key = (inv.invoice_date, inv.remark or "")
        invoice_groups[key].append(inv)
    
    for key, inv_list in invoice_groups.items():
        latest_invoice = max(inv_list, key=lambda x: x.id)
        entries.append({
            "date": latest_invoice.invoice_date.strftime('%d-%m-%Y') if latest_invoice.invoice_date else '',
            "description": latest_invoice.invoice_number,
            "credit": 0,
            "debit": float(latest_invoice.total_with_gst) if latest_invoice.total_with_gst else 0,
            "type": "Invoice"
        })
    
    # Handle buyer duplicates
    buyer_groups = defaultdict(list)
    for b in buyers:
        key = (b.date, b.notes or "")
        buyer_groups[key].append(b)
    
    for key, buyer_list in buyer_groups.items():
        latest_buyer = max(buyer_list, key=lambda x: x.id)
        entries.append({
            "date": latest_buyer.date.strftime('%d-%m-%Y') if latest_buyer.date else '',
            "description": latest_buyer.notes or "Deposit",
            "credit": float(latest_buyer.amount) if latest_buyer.amount else 0,
            "debit": 0,
            "type": "Deposit"
        })
    
    # Handle company bill duplicates
    company_bill_groups = defaultdict(list)
    for cb in company_bills:
        key = (cb.date, cb.notice or "")
        company_bill_groups[key].append(cb)
    
    for key, cb_list in company_bill_groups.items():
        latest_cb = max(cb_list, key=lambda x: x.id)
        entries.append({
            "date": latest_cb.date.strftime('%d-%m-%Y') if latest_cb.date else '',
            "description": latest_cb.notice or "Company Bill Credit",
            "credit": float(latest_cb.amount) if latest_cb.amount else 0,
            "debit": 0,
            "type": "Credit"
        })
    
    # Handle other transaction duplicates
    other_groups = defaultdict(list)
    for ot in other_transactions:
        key = (ot.date, ot.notice or "")
        other_groups[key].append(ot)
    
    for key, ot_list in other_groups.items():
        latest_ot = max(ot_list, key=lambda x: x.id)
        # Use name if available, otherwise use type
        description = latest_ot.name if latest_ot.name else latest_ot.type
        entries.append({
            "date": latest_ot.date.strftime('%d-%m-%Y') if latest_ot.date else '',
            "description": description,
            "credit": float(latest_ot.amount) if latest_ot.transaction_type == "credit" else 0,
            "debit": float(latest_ot.amount) if latest_ot.transaction_type == "debit" else 0,
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