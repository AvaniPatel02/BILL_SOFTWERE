#!/usr/bin/env python3
"""
Test script for Balance Sheet Unsettled Entries functionality

This script tests that the balance sheet correctly includes unsettled entries from previous years
in the current year's balance sheet calculations, and properly discards fully settled entries.
"""

import os
import sys
import django
from datetime import datetime, date
from decimal import Decimal

# Add the backend directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, 'BACKEND', 'backend')
sys.path.insert(0, backend_path)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Configure Django
django.setup()

# Now import Django models and views
try:
    from api.models import Invoice, Buyer, CompanyBill, OtherTransaction, Salary, CustomUser
    from api.views_balancesheet import BalanceSheetView
    from django.utils import timezone
    print("✅ Django imports successful!")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this script from the project root directory")
    sys.exit(1)

def test_unsettled_entries():
    """Test that unsettled entries are correctly included in balance sheet"""
    
    # Create test data for previous year (2023-2024)
    previous_year_start = date(2023, 4, 1)
    previous_year_end = date(2024, 3, 31)
    
    # Create test data for current year (2024-2025)
    current_year_start = date(2024, 4, 1)
    current_year_end = date(2025, 3, 31)
    
    print("Testing Balance Sheet Unsettled Entries Functionality")
    print("=" * 60)
    
    # Get or create a test user
    try:
        test_user = CustomUser.objects.first()
        if not test_user:
            test_user = CustomUser.objects.create_user(
                email='test@example.com',
                first_name='Test User',
                mobile='1234567890',
                password='testpass123'
            )
        print(f"   - Using test user: {test_user.email}")
    except Exception as e:
        print(f"   ❌ Error creating test user: {e}")
        return
    
    # Test 1: Create an unsettled invoice from previous year
    print("\n1. Creating test data...")
    
    try:
        # Create a test invoice from previous year (unsettled)
        test_invoice = Invoice.objects.create(
            user=test_user,
            buyer_name="Test Company ABC",
            buyer_address="123 Test Street",
            invoice_date=date(2024, 2, 15),  # Previous year
            base_amount=10000.0,
            total_amount=10000.0,
            total_with_gst=11800.0,
            taxtotal=1800.0,
            cgst=900.0,
            sgst=900.0,
            is_deleted=False
        )
        
        # Create a test buyer payment from current year (partial settlement)
        test_buyer = Buyer.objects.create(
            user=test_user,
            name="Test Company ABC",
            date=date(2024, 5, 15),  # Current year
            amount=5000.0,
            payment_type="Bank"
        )
        
        # Create a test company bill from current year (additional settlement)
        test_company_bill = CompanyBill.objects.create(
            company="Test Company ABC",
            date=date(2024, 6, 15),  # Current year
            amount=3000.0,
            payment_type="Bank"
        )
        
        print(f"   - Created invoice: {test_invoice.buyer_name} - ₹{test_invoice.total_with_gst}")
        print(f"   - Created buyer payment: ₹{test_buyer.amount}")
        print(f"   - Created company bill: ₹{test_company_bill.amount}")
        
    except Exception as e:
        print(f"   ❌ Error creating test data: {e}")
        return
    
    # Test 2: Test the balance sheet calculation
    print("\n2. Testing balance sheet calculation...")
    
    # Create a mock request for current year
    class MockRequest:
        def __init__(self):
            self.query_params = {'financial_year': '2024-2025'}
    
    mock_request = MockRequest()
    balance_sheet_view = BalanceSheetView()
    
    try:
        response = balance_sheet_view.get(mock_request)
        data = response.data
        
        print(f"   - Financial Year: {data['financial_year']}")
        
        # Check if the unsettled amount appears in sundry debtors/creditors
        sundry_entries = data['data']['sundry_debtors_creditors']
        test_company_entry = None
        
        for entry in sundry_entries:
            if entry['name'] == "Test Company ABC":
                test_company_entry = entry
                break
        
        if test_company_entry:
            expected_amount = 11800.0 - 5000.0 - 3000.0  # Invoice - Buyer - Company Bill
            actual_amount = test_company_entry['amount']
            entry_type = test_company_entry['type']
            
            print(f"   - Found {entry_type}: {test_company_entry['name']} - ₹{actual_amount}")
            print(f"   - Expected amount: ₹{expected_amount}")
            
            if abs(actual_amount - expected_amount) < 0.01:
                print("   ✅ Test PASSED: Unsettled amount correctly calculated!")
            else:
                print("   ❌ Test FAILED: Amount mismatch!")
        else:
            print("   ❌ Test FAILED: Test company not found in sundry entries!")
            
    except Exception as e:
        print(f"   ❌ Test FAILED with error: {str(e)}")
    
    # Test 3: Test fully settled entry (should be discarded)
    print("\n3. Testing fully settled entry (should be discarded)...")
    
    try:
        # Create a fully settled invoice
        settled_invoice = Invoice.objects.create(
            user=test_user,
            buyer_name="Fully Settled Company",
            buyer_address="456 Settled Street",
            invoice_date=date(2024, 1, 15),  # Previous year
            base_amount=5000.0,
            total_amount=5000.0,
            total_with_gst=5900.0,
            taxtotal=900.0,
            cgst=450.0,
            sgst=450.0,
            is_deleted=False
        )
        
        # Create full settlement payment
        settled_payment = Buyer.objects.create(
            user=test_user,
            name="Fully Settled Company",
            date=date(2024, 4, 15),  # Current year
            amount=5900.0,  # Full amount
            payment_type="Bank"
        )
        
        print(f"   - Created settled invoice: {settled_invoice.buyer_name} - ₹{settled_invoice.total_with_gst}")
        print(f"   - Created full settlement: ₹{settled_payment.amount}")
        
        response = balance_sheet_view.get(mock_request)
        data = response.data
        
        # Check if the fully settled company appears in sundry debtors/creditors
        sundry_entries = data['data']['sundry_debtors_creditors']
        settled_company_entry = None
        
        for entry in sundry_entries:
            if entry['name'] == "Fully Settled Company":
                settled_company_entry = entry
                break
        
        if settled_company_entry:
            print(f"   ❌ Test FAILED: Fully settled company should not appear in balance sheet!")
            print(f"   - Found entry: {settled_company_entry['name']} - ₹{settled_company_entry['amount']}")
        else:
            print("   ✅ Test PASSED: Fully settled entry correctly discarded from balance sheet!")
            
    except Exception as e:
        print(f"   ❌ Test FAILED with error: {str(e)}")
    
    # Test 4: Clean up test data
    print("\n4. Cleaning up test data...")
    
    try:
        # Clean up all test data
        test_data = [
            test_invoice, test_buyer, test_company_bill,
            settled_invoice, settled_payment
        ]
        
        for item in test_data:
            if hasattr(item, 'delete'):
                item.delete()
        
        print("   ✅ Test data cleaned up successfully!")
    except Exception as e:
        print(f"   ⚠️  Cleanup warning: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Test completed!")

if __name__ == "__main__":
    test_unsettled_entries()