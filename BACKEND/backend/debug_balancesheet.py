#!/usr/bin/env python3
"""
Debug script to investigate zero-amount entries in balance sheet
"""

import os
import sys
import django
from datetime import datetime, date
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Invoice, Buyer, CompanyBill, OtherTransaction, Salary, CustomUser
from api.views_balancesheet import BalanceSheetView
from django.utils import timezone

def debug_zero_amount_entries():
    """Debug why zero-amount entries are still showing"""
    
    print("🔍 Debugging Zero-Amount Entries in Balance Sheet")
    print("=" * 60)
    
    # Create a mock request for current year
    class MockRequest:
        def __init__(self):
            self.query_params = {'financial_year': '2025-2026'}
    
    mock_request = MockRequest()
    balance_sheet_view = BalanceSheetView()
    
    try:
        response = balance_sheet_view.get(mock_request)
        data = response.data
        
        print(f"📊 Financial Year: {data['financial_year']}")
        
        # Check sundry debtors/creditors for zero amounts
        sundry_entries = data['data']['sundry_debtors_creditors']
        zero_entries = []
        
        print(f"\n🔍 Found {len(sundry_entries)} sundry entries:")
        for entry in sundry_entries:
            amount = entry['amount']
            name = entry['name']
            entry_type = entry['type']
            
            print(f"   - {name}: ₹{amount} ({entry_type})")
            
            # Check for zero or near-zero amounts
            if abs(amount) < 0.01:
                zero_entries.append(entry)
                print(f"   ⚠️  ZERO AMOUNT DETECTED: {name} = ₹{amount}")
        
        if zero_entries:
            print(f"\n❌ PROBLEM: Found {len(zero_entries)} entries with zero amounts:")
            for entry in zero_entries:
                print(f"   - {entry['name']}: ₹{entry['amount']} ({entry['type']})")
        else:
            print(f"\n✅ No zero-amount entries found!")
        
        # Let's also check the raw data processing
        print(f"\n🔍 Checking raw data processing...")
        
        # Get the current financial year
        fy = "2025-2026"
        start_year, end_year = map(int, fy.split('-'))
        fy_start = timezone.datetime(start_year, 4, 1).date()
        fy_end = timezone.datetime(end_year, 3, 31).date()
        
        # Check invoices
        invoices = Invoice.objects.filter(
            invoice_date__gte=fy_start, 
            invoice_date__lte=fy_end, 
            is_deleted=False
        )
        print(f"   - Current year invoices: {invoices.count()}")
        
        # Check buyers
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        print(f"   - Current year buyers: {buyers.count()}")
        
        # Check company bills
        company_bills = CompanyBill.objects.filter(date__gte=fy_start, date__lte=fy_end)
        print(f"   - Current year company bills: {company_bills.count()}")
        
        # Check other transactions
        other_txns = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end)
        print(f"   - Current year other transactions: {other_txns.count()}")
        
        # Look for ROHIT and VINI specifically
        print(f"\n🔍 Searching for ROHIT and VINI entries...")
        
        # Check invoices
        rohit_invoices = invoices.filter(buyer_name__icontains='ROHIT')
        vini_invoices = invoices.filter(buyer_name__icontains='VINI')
        print(f"   - ROHIT invoices: {rohit_invoices.count()}")
        print(f"   - VINI invoices: {vini_invoices.count()}")
        
        # Check buyers
        rohit_buyers = buyers.filter(name__icontains='ROHIT')
        vini_buyers = buyers.filter(name__icontains='VINI')
        print(f"   - ROHIT buyers: {rohit_buyers.count()}")
        print(f"   - VINI buyers: {vini_buyers.count()}")
        
        # Check company bills
        rohit_bills = company_bills.filter(company__icontains='ROHIT')
        vini_bills = company_bills.filter(company__icontains='VINI')
        print(f"   - ROHIT company bills: {rohit_bills.count()}")
        print(f"   - VINI company bills: {vini_bills.count()}")
        
        # Check other transactions
        rohit_txns = other_txns.filter(name__icontains='ROHIT')
        vini_txns = other_txns.filter(name__icontains='VINI')
        print(f"   - ROHIT other transactions: {rohit_txns.count()}")
        print(f"   - VINI other transactions: {vini_txns.count()}")
        
        # Show detailed breakdown for ROHIT
        if rohit_invoices.exists() or rohit_buyers.exists() or rohit_bills.exists() or rohit_txns.exists():
            print(f"\n📋 ROHIT Detailed Breakdown:")
            total_rohit = 0.0
            
            for inv in rohit_invoices:
                amount = float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))
                total_rohit += amount
                print(f"   + Invoice: ₹{amount} ({inv.invoice_date})")
            
            for buyer in rohit_buyers:
                amount = float(buyer.amount)
                total_rohit += amount
                print(f"   + Buyer: ₹{amount} ({buyer.date})")
            
            for bill in rohit_bills:
                amount = float(bill.amount)
                total_rohit -= amount
                print(f"   - Company Bill: ₹{amount} ({bill.date})")
            
            for txn in rohit_txns:
                amount = float(txn.amount)
                if txn.transaction_type == 'debit':
                    total_rohit += amount
                    print(f"   + Other Debit: ₹{amount} ({txn.date})")
                else:
                    total_rohit -= amount
                    print(f"   - Other Credit: ₹{amount} ({txn.date})")
            
            print(f"   = Net ROHIT: ₹{total_rohit}")
        
        # Show detailed breakdown for VINI
        if vini_invoices.exists() or vini_buyers.exists() or vini_bills.exists() or vini_txns.exists():
            print(f"\n📋 VINI Detailed Breakdown:")
            total_vini = 0.0
            
            for inv in vini_invoices:
                amount = float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))
                total_vini += amount
                print(f"   + Invoice: ₹{amount} ({inv.invoice_date})")
            
            for buyer in vini_buyers:
                amount = float(buyer.amount)
                total_vini += amount
                print(f"   + Buyer: ₹{amount} ({buyer.date})")
            
            for bill in vini_bills:
                amount = float(bill.amount)
                total_vini -= amount
                print(f"   - Company Bill: ₹{amount} ({bill.date})")
            
            for txn in vini_txns:
                amount = float(txn.amount)
                if txn.transaction_type == 'debit':
                    total_vini += amount
                    print(f"   + Other Debit: ₹{amount} ({txn.date})")
                else:
                    total_vini -= amount
                    print(f"   - Other Credit: ₹{amount} ({txn.date})")
            
            print(f"   = Net VINI: ₹{total_vini}")
            
    except Exception as e:
        print(f"❌ Error during debugging: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_zero_amount_entries()