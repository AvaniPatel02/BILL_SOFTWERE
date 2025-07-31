from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice, Buyer, CompanyBill, Salary, OtherTransaction, BalanceSheet, ArchivedInvoice
from .serializers import BalanceSheetSerializer
from django.db.models import Sum
from collections import defaultdict
from django.utils import timezone

def get_carry_forward_amounts(start_year, end_year):
    """
    Calculate carry-forward amounts from previous years for the given financial year.
    Returns a dictionary with carry-forward amounts for different categories.
    """
    carry_forward = {
        'sundry_debtors_creditors': {},
        'capital': {},
        'loan_credit': {},
        'loan_debit': {},
        'unsecure_loan_credit': {},
        'unsecure_loan_debit': {},
        'fixed_assets_credit': {},
        'fixed_assets_debit': {},
        'salary': {},
        'buyer': {},
        'dynamic_sections': {}
    }
    
    # Calculate carry-forward from all previous years up to the start of current FY
    current_fy_start = timezone.datetime(start_year, 4, 1).date()
    
    # Get all data from previous years (before current FY start)
    previous_invoices = Invoice.objects.filter(
        invoice_date__lt=current_fy_start, 
        is_deleted=False
    )
    previous_buyers = Buyer.objects.filter(date__lt=current_fy_start)
    previous_company_bills = CompanyBill.objects.filter(date__lt=current_fy_start)
    previous_other_txns = OtherTransaction.objects.filter(date__lt=current_fy_start)
    previous_salaries = Salary.objects.filter(date__lt=current_fy_start)
    previous_deleted_invoices = Invoice.objects.filter(
        invoice_date__lt=current_fy_start, 
        is_deleted=True
    )
    previous_archived_invoices = ArchivedInvoice.objects.filter(
        invoice_date__lt=current_fy_start
    )
    
    # Reserved types
    reserved_types = {t.strip().lower() for t in [
        'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
    ]}
    
    # Calculate carry-forward for Sundry Debtors/Creditors
    all_previous_names = set()
    for inv in previous_invoices:
        all_previous_names.add(inv.buyer_name.strip())
    for b in previous_buyers:
        all_previous_names.add(b.name.strip())
    for cb in previous_company_bills:
        all_previous_names.add(cb.company.strip())
    for ot in previous_other_txns:
        # Don't add OtherTransaction names to sundry calculation - they will be handled by dynamic sections
        pass
    
    for name in all_previous_names:
        key = name.strip()
        if key.lower() in reserved_types:
            continue
            
        total = 0.0
        # Add invoice amounts (debit)
        total += sum(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))) 
                    for inv in previous_invoices if inv.buyer_name.strip() == key)
        # Add buyer amounts (debit)
        total += sum(float(b.amount) for b in previous_buyers if b.name.strip() == key)
        # Subtract company bill amounts (credit)
        total -= sum(float(cb.amount) for cb in previous_company_bills if cb.company.strip() == key)
        # OtherTransaction amounts are handled by dynamic sections, not sundry
        # total += sum(float(ot.amount) for ot in previous_other_txns 
        #             if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit' and ot.type.lower() not in reserved_types)
        # total -= sum(float(ot.amount) for ot in previous_other_txns 
        #             if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit' and ot.type.lower() not in reserved_types)
        
        # Only carry forward if amount is significantly different from zero
        if abs(total) > 0.01:
            carry_forward['sundry_debtors_creditors'][key] = total
    
    # Calculate carry-forward for Capital (Partners)
    for ot in previous_other_txns:
        if ot.type and ot.type.lower() == 'partner':
            name = ot.name or ot.notice
            if name not in carry_forward['capital']:
                carry_forward['capital'][name] = 0.0
            amt = float(ot.amount)
            carry_forward['capital'][name] += amt if ot.transaction_type == 'credit' else -amt
    
    # Calculate carry-forward for Loans
    for ot in previous_other_txns:
        if ot.type and ot.type.lower() == 'loan':
            name = ot.bank_name or ot.notice
            if name not in carry_forward['loan_credit']:
                carry_forward['loan_credit'][name] = 0.0
            amt = float(ot.amount)
            carry_forward['loan_credit'][name] += amt if ot.transaction_type == 'credit' else -amt
    
    # Calculate carry-forward for Unsecure Loans
    for ot in previous_other_txns:
        if ot.type and ot.type.lower() == 'unsecure loan':
            name = ot.name or ot.notice
            if name not in carry_forward['unsecure_loan_credit']:
                carry_forward['unsecure_loan_credit'][name] = 0.0
            amt = float(ot.amount)
            carry_forward['unsecure_loan_credit'][name] += amt if ot.transaction_type == 'credit' else -amt
    
    # Calculate carry-forward for Fixed Assets
    for ot in previous_other_txns:
        if ot.type and ot.type.lower() == 'fixed assets':
            name = ot.name or ot.notice
            amt = float(ot.amount)
            if ot.transaction_type == 'credit':
                if name not in carry_forward['fixed_assets_credit']:
                    carry_forward['fixed_assets_credit'][name] = 0.0
                carry_forward['fixed_assets_credit'][name] += amt
            else:
                if name not in carry_forward['fixed_assets_debit']:
                    carry_forward['fixed_assets_debit'][name] = 0.0
                carry_forward['fixed_assets_debit'][name] += amt
    
    # Calculate carry-forward for Salary
    for s in previous_salaries:
        name = s.name
        if name not in carry_forward['salary']:
            carry_forward['salary'][name] = 0.0
        carry_forward['salary'][name] += float(s.amount)
    
    # Calculate carry-forward for Buyers
    for b in previous_buyers:
        name = b.name
        if name not in carry_forward['buyer']:
            carry_forward['buyer'][name] = 0.0
        carry_forward['buyer'][name] += float(b.amount)
    
    # Calculate carry-forward for Dynamic Sections
    for ot in previous_other_txns:
        if ot.type and ot.type.lower() not in reserved_types:
            type_key = ot.type.strip()
            if type_key not in carry_forward['dynamic_sections']:
                carry_forward['dynamic_sections'][type_key] = {'credit': {}, 'debit': {}}
            
            name = ot.name or ot.notice
            amt = float(ot.amount)
            if ot.transaction_type == 'credit':
                if name not in carry_forward['dynamic_sections'][type_key]['credit']:
                    carry_forward['dynamic_sections'][type_key]['credit'][name] = 0.0
                carry_forward['dynamic_sections'][type_key]['credit'][name] += amt
            else:
                if name not in carry_forward['dynamic_sections'][type_key]['debit']:
                    carry_forward['dynamic_sections'][type_key]['debit'][name] = 0.0
                carry_forward['dynamic_sections'][type_key]['debit'][name] += amt
    
    # Add carry-forward from deleted and archived invoices to unsecure loan debit
    for inv in previous_deleted_invoices:
        name = inv.buyer_name
        if name not in carry_forward['unsecure_loan_debit']:
            carry_forward['unsecure_loan_debit'][name] = 0.0
        carry_forward['unsecure_loan_debit'][name] += float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))
    
    for inv in previous_archived_invoices:
        name = inv.buyer_name
        if name not in carry_forward['unsecure_loan_debit']:
            carry_forward['unsecure_loan_debit'][name] = 0.0
        carry_forward['unsecure_loan_debit'][name] += float(inv.total_tax_amount if inv.total_tax_amount is not None else (inv.total_with_gst or 0))
    
    return carry_forward

class BalanceSheetView(APIView):
    def get(self, request):
        # Accept financial year as 'YYYY-YYYY' (e.g., '2024-2025')
        fy = request.query_params.get('financial_year')
        if fy:
            try:
                start_year, end_year = map(int, fy.split('-'))
            except Exception:
                return Response({'error': 'Invalid financial_year format. Use YYYY-YYYY.'}, status=400)
        else:
            # Default: use current financial year
            today = timezone.now().date()
            if today.month >= 4:
                start_year = today.year
                end_year = today.year + 1
            else:
                start_year = today.year - 1
                end_year = today.year
            fy = f"{start_year}-{end_year}"
        fy_start = timezone.datetime(start_year, 4, 1).date()
        fy_end = timezone.datetime(end_year, 3, 31).date()

        # Get carry-forward amounts from previous years
        carry_forward = get_carry_forward_amounts(start_year, end_year)

        # Capital (Partners) from OtherTransaction + carry-forward
        capital = []
        partners = OtherTransaction.objects.filter(type__iexact='partner', date__gte=fy_start, date__lte=fy_end)
        for p in partners:
            amt = float(p.amount)
            name = p.name or p.notice
            found = next((item for item in capital if item['name'] == name), None)
            if found:
                found['amount'] += amt if p.transaction_type == 'credit' else -amt
            else:
                capital.append({
                    'name': name,
                    'amount': amt if p.transaction_type == 'credit' else -amt,
                    'notice': p.notice,
                })
        
        # Add carry-forward amounts
        for name, amount in carry_forward['capital'].items():
            if abs(amount) > 0.01:
                found = next((item for item in capital if item['name'] == name), None)
                if found:
                    found['amount'] += amount
                else:
                    capital.append({
                        'name': name,
                        'amount': amount,
                        'notice': f"Carry-forward from previous years",
                    })
        
        capital = [item for item in capital if abs(item['amount']) > 0.01]  # Remove near-zero amounts

        # Loan Credit/Debit from OtherTransaction + carry-forward
        loan = []
        loans = OtherTransaction.objects.filter(type__iexact='loan', date__gte=fy_start, date__lte=fy_end)
        for l in loans:
            amt = float(l.amount)
            name = l.bank_name or l.notice
            found = next((item for item in loan if item['name'] == name), None)
            if found:
                found['amount'] += amt if l.transaction_type == 'credit' else -amt
            else:
                loan.append({
                    'name': name,
                    'amount': amt if l.transaction_type == 'credit' else -amt,
                    'bank_name': l.bank_name,
                    'notice': l.notice,
                })
        
        # Add carry-forward amounts
        for name, amount in carry_forward['loan_credit'].items():
            if abs(amount) > 0.01:
                found = next((item for item in loan if item['name'] == name), None)
                if found:
                    found['amount'] += amount
                else:
                    loan.append({
                        'name': name,
                        'amount': amount,
                        'bank_name': name,
                        'notice': f"Carry-forward from previous years",
                    })
        
        loan_credit = [item for item in loan if item['amount'] > 0.01]
        loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in loan if item['amount'] < -0.01]

        # Unsecure Loan Credit/Debit from OtherTransaction + carry-forward
        unsecure_loan = []
        unsecure_loans = OtherTransaction.objects.filter(type__iexact='unsecure loan', date__gte=fy_start, date__lte=fy_end)
        for l in unsecure_loans:
            amt = float(l.amount)
            name = l.name or l.notice
            found = next((item for item in unsecure_loan if item['name'] == name), None)
            if found:
                found['amount'] += amt if l.transaction_type == 'credit' else -amt
            else:
                unsecure_loan.append({
                    'name': name,
                    'amount': amt if l.transaction_type == 'credit' else -amt,
                    'bank_name': l.bank_name,
                    'notice': l.notice,
                })
        
        # Add carry-forward amounts
        for name, amount in carry_forward['unsecure_loan_credit'].items():
            if abs(amount) > 0.01:
                found = next((item for item in unsecure_loan if item['name'] == name), None)
                if found:
                    found['amount'] += amount
                else:
                    unsecure_loan.append({
                        'name': name,
                        'amount': amount,
                        'bank_name': name,
                        'notice': f"Carry-forward from previous years",
                    })
        
        unsecure_loan_credit = [item for item in unsecure_loan if item['amount'] > 0.01]
        unsecure_loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in unsecure_loan if item['amount'] < -0.01]

        # Fixed Assets from OtherTransaction - Separate credit and debit + carry-forward
        fixed_assets_credit_dict = defaultdict(float)
        fixed_assets_debit_dict = defaultdict(float)
        assets = OtherTransaction.objects.filter(type__iexact='fixed assets', date__gte=fy_start, date__lte=fy_end)
        for a in assets:
            display_name = a.name or a.notice
            amount = float(a.amount)
            if a.transaction_type == 'credit':
                fixed_assets_credit_dict[display_name] += amount
            else:  # debit
                fixed_assets_debit_dict[display_name] += amount
        
        # Add carry-forward amounts
        for name, amount in carry_forward['fixed_assets_credit'].items():
            if amount > 0.01:
                fixed_assets_credit_dict[name] += amount
        for name, amount in carry_forward['fixed_assets_debit'].items():
            if amount > 0.01:
                fixed_assets_debit_dict[name] += amount
        
        fixed_assets_credit = [[k, v] for k, v in fixed_assets_credit_dict.items() if v > 0.01]
        fixed_assets_debit = [[k, v] for k, v in fixed_assets_debit_dict.items() if v > 0.01]

        # Salary + carry-forward
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += float(s.amount)
        
        # Add carry-forward amounts
        for name, amount in carry_forward['salary'].items():
            if amount > 0.01:
                salary_dict[name] += amount
        
        salary = [[k, v] for k, v in salary_dict.items() if v > 0.01]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors) + carry-forward
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += float(b.amount)
        
        # Add carry-forward amounts
        for name, amount in carry_forward['buyer'].items():
            if amount > 0.01:
                buyer_dict[name] += amount
        
        buyer = [[k, v] for k, v in buyer_dict.items() if v > 0.01]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        # Sundry Debtors/Creditors calculation with automatic settlement + carry-forward
        # 1. Collect all unique buyer/company names from invoices, buyers, company bills, and relevant OtherTransactions
        all_names = set()
        invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=False)
        for inv in invoices:
            all_names.add(inv.buyer_name.strip())
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            all_names.add(b.name.strip())
        companybills = CompanyBill.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for cb in companybills:
            all_names.add(cb.company.strip())
        other_buyer_txns = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end)
        # Don't add OtherTransaction names to sundry calculation - they will be handled by dynamic sections
        # for ot in other_buyer_txns:
        #     if ot.name and ot.type.lower() not in reserved_types:
        #         all_names.add(ot.name.strip())
        
        # Add names from carry-forward
        for name in carry_forward['sundry_debtors_creditors'].keys():
            all_names.add(name.strip())
        
        # 2. For each name, sum up all debits and credits as per the rules, but skip reserved types
        sundry_dict = {}
        for name in all_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
            total = 0.0
            # Add all invoice amounts (debit)
            total += sum(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))) for inv in invoices if inv.buyer_name.strip() == key)
            # Add all buyer amounts (debit)
            total += sum(float(b.amount) for b in buyers if b.name.strip() == key)
            # Subtract all company bill amounts (credit)
            total -= sum(float(cb.amount) for cb in companybills if cb.company.strip() == key)
            # OtherTransaction amounts are handled by dynamic sections, not sundry
            # total += sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit' and ot.type.lower() not in reserved_types)
            # total -= sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit' and ot.type.lower() not in reserved_types)
            
            # Add carry-forward amount
            if key in carry_forward['sundry_debtors_creditors']:
                total += carry_forward['sundry_debtors_creditors'][key]
            
            # Only include if amount is significantly different from zero (automatic settlement)
            if abs(total) > 0.01:
                sundry_dict[key] = total
        # 3. Build Sundry Debtors/Creditors list
        sundry_debtors_creditors = []
        for name, amount in sundry_dict.items():
            if amount > 0.01:
                sundry_debtors_creditors.append({"name": name, "amount": amount, "type": "Debtor"})
            elif amount < -0.01:
                sundry_debtors_creditors.append({"name": name, "amount": abs(amount), "type": "Creditor"})

        # Add deleted invoices to Unsecure Loan (Debit) + carry-forward
        deleted_invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=True)
        for inv in deleted_invoices:
            unsecure_loan_debit.append({
                "name": inv.buyer_name,
                "amount": float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))),
                "type": "Unsecure Loan"
            })
        
        # Add carry-forward amounts from deleted invoices
        for name, amount in carry_forward['unsecure_loan_debit'].items():
            if amount > 0.01:
                unsecure_loan_debit.append({
                    "name": name,
                    "amount": amount,
                    "type": "Unsecure Loan (Carry-forward)"
                })
        
        # Add archived invoices to Unsecure Loan (Debit)
        archived_invoices = ArchivedInvoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end)
        for inv in archived_invoices:
            unsecure_loan_debit.append({
                "name": inv.buyer_name,
                "amount": float(inv.total_tax_amount if inv.total_tax_amount is not None else (inv.total_with_gst or 0)),
                "type": "Unsecure Loan"
            })

        # Dynamic sections for OtherTransaction types (excluding reserved types and sundry names) + carry-forward
        sundry_keys_set = {k.strip().lower() for k in sundry_dict.keys()}
        dynamic_sections = {}
        
        # Get all OtherTransaction types that are not reserved and not in sundry
        other_types = OtherTransaction.objects.filter(
            date__gte=fy_start, 
            date__lte=fy_end
        ).exclude(
            type__iexact='partner'
        ).exclude(
            type__iexact='loan'
        ).exclude(
            type__iexact='fixed assets'
        ).exclude(
            type__iexact='unsecure loan'
        ).values_list('type', flat=True).distinct()
        
        # Add types from carry-forward
        carry_forward_types = set(carry_forward['dynamic_sections'].keys())
        all_types = set(other_types) | carry_forward_types
        
        for ot_type in all_types:
            if not ot_type or ot_type.strip().lower() in reserved_types or ot_type.strip().lower() in sundry_keys_set:
                continue
                
            type_key = ot_type.strip()
            credit_entries = []
            debit_entries = []
            
            # Get all transactions for this type in current year
            type_transactions = OtherTransaction.objects.filter(
                type__iexact=type_key,
                date__gte=fy_start,
                date__lte=fy_end
            )
            
            for txn in type_transactions:
                display_name = txn.name or txn.notice or type_key
                amount = float(txn.amount)
                
                if txn.transaction_type == 'credit':
                    credit_entries.append([display_name, amount])
                elif txn.transaction_type == 'debit':
                    debit_entries.append([display_name, amount])
            
            # Add carry-forward amounts for this type
            if type_key in carry_forward['dynamic_sections']:
                carry_forward_data = carry_forward['dynamic_sections'][type_key]
                
                # Add credit carry-forward
                for name, amount in carry_forward_data['credit'].items():
                    if amount > 0.01:
                        credit_entries.append([f"{name} (Carry-forward)", amount])
                
                # Add debit carry-forward
                for name, amount in carry_forward_data['debit'].items():
                    if amount > 0.01:
                        debit_entries.append([f"{name} (Carry-forward)", amount])
            
            # Only include if there are entries
            if credit_entries or debit_entries:
                dynamic_sections[type_key] = {
                    'credit': credit_entries,
                    'debit': debit_entries
                }

        # Compose the response
        data = {
            "capital": capital,
            "loan_credit": loan_credit,
            "loan_debit": loan_debit,
            "unsecure_loan_credit": unsecure_loan_credit,
            "unsecure_loan_debit": unsecure_loan_debit,
            "fixed_assets_credit": fixed_assets_credit,
            "fixed_assets_debit": fixed_assets_debit,
            "salary": salary,
            "salary_total": salary_total,
            "sundry_debtors_creditors": sundry_debtors_creditors,
            "dynamic_sections": dynamic_sections,
        }
        return Response({"financial_year": fy, "data": data})

    def post(self, request):
        serializer = BalanceSheetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def put(self, request):
        year = request.data.get('year')
        if not year:
            return Response({'detail': 'Year required'}, status=400)
        try:
            sheet = BalanceSheet.objects.get(year=year)
        except BalanceSheet.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        serializer = BalanceSheetSerializer(sheet, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class BalanceSheetSnapshotView(APIView):
    def post(self, request):
        fy = request.data.get('financial_year')
        if fy:
            try:
                start_year, end_year = map(int, fy.split('-'))
            except Exception:
                return Response({'error': 'Invalid financial_year format. Use YYYY-YYYY.'}, status=400)
        else:
            today = timezone.now().date()
            if today.month >= 4:
                start_year = today.year
                end_year = today.year + 1
            else:
                start_year = today.year - 1
                end_year = today.year
            fy = f"{start_year}-{end_year}"
        fy_start = timezone.datetime(start_year, 4, 1).date()
        fy_end = timezone.datetime(end_year, 3, 31).date()
        
        # Get carry-forward amounts from previous years
        carry_forward = get_carry_forward_amounts(start_year, end_year)
        
        # --- Copy the same calculation logic as in BalanceSheetView.get() ---
        # Capital (Partners) from OtherTransaction + carry-forward
        capital_dict = defaultdict(float)
        partners = OtherTransaction.objects.filter(type__iexact='partner', date__gte=fy_start, date__lte=fy_end)
        for p in partners:
            amt = float(p.amount)
            if p.transaction_type == 'credit':
                capital_dict[p.notice] += amt
            elif p.transaction_type == 'debit':
                capital_dict[p.notice] -= amt
        
        # Add carry-forward amounts
        for name, amount in carry_forward['capital'].items():
            if abs(amount) > 0.01:
                capital_dict[name] += amount
        
        capital = [[k, v] for k, v in capital_dict.items() if abs(v) > 0.01]

        # Loan Credit/Debit from OtherTransaction + carry-forward
        loan_dict = defaultdict(float)
        loans = OtherTransaction.objects.filter(type__iexact='loan', date__gte=fy_start, date__lte=fy_end)
        for l in loans:
            amt = float(l.amount)
            if l.transaction_type == 'credit':
                loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                loan_dict[l.notice] -= amt
        
        # Add carry-forward amounts
        for name, amount in carry_forward['loan_credit'].items():
            if abs(amount) > 0.01:
                loan_dict[name] += amount
        
        loan_credit = [[k, v] for k, v in loan_dict.items() if v > 0.01]
        loan_debit = [[k, abs(v)] for k, v in loan_dict.items() if v < -0.01]

        # Unsecure Loan Credit/Debit from OtherTransaction + carry-forward
        unsecure_loan_dict = defaultdict(float)
        unsecure_loans = OtherTransaction.objects.filter(type__iexact='unsecure loan', date__gte=fy_start, date__lte=fy_end)
        for l in unsecure_loans:
            amt = float(l.amount)
            if l.transaction_type == 'credit':
                unsecure_loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                unsecure_loan_dict[l.notice] -= amt
        
        # Add carry-forward amounts
        for name, amount in carry_forward['unsecure_loan_credit'].items():
            if abs(amount) > 0.01:
                unsecure_loan_dict[name] += amount
        
        unsecure_loan_credit = [[k, v] for k, v in unsecure_loan_dict.items() if v > 0.01]
        unsecure_loan_debit = [[k, abs(v)] for k, v in unsecure_loan_dict.items() if v < -0.01]

        # Fixed Assets from OtherTransaction + carry-forward
        fixed_assets_dict = defaultdict(float)
        assets = OtherTransaction.objects.filter(type__iexact='fixed assets', date__gte=fy_start, date__lte=fy_end)
        for a in assets:
            display_name = a.name or a.notice
            fixed_assets_dict[display_name] += float(a.amount)
        
        # Add carry-forward amounts
        for name, amount in carry_forward['fixed_assets_credit'].items():
            if amount > 0.01:
                fixed_assets_dict[name] += amount
        for name, amount in carry_forward['fixed_assets_debit'].items():
            if amount > 0.01:
                fixed_assets_dict[name] += amount
        
        fixed_assets = [[k, v] for k, v in fixed_assets_dict.items() if v > 0.01]

        # Salary + carry-forward
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += float(s.amount)
        
        # Add carry-forward amounts
        for name, amount in carry_forward['salary'].items():
            if amount > 0.01:
                salary_dict[name] += amount
        
        salary = [[k, v] for k, v in salary_dict.items() if v > 0.01]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors) + carry-forward
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += float(b.amount)
        
        # Add carry-forward amounts
        for name, amount in carry_forward['buyer'].items():
            if amount > 0.01:
                buyer_dict[name] += amount
        
        buyer = [[k, v] for k, v in buyer_dict.items() if v > 0.01]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        # Sundry Debtors/Creditors calculation with automatic settlement + carry-forward
        all_names = set()
        invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=False)
        for inv in invoices:
            all_names.add(inv.buyer_name.strip().lower())
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            all_names.add(b.name.strip().lower())
        companybills = CompanyBill.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for cb in companybills:
            all_names.add(cb.company.strip().lower())
        other_buyer_txns = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end)
        
        sundry_dict = {}
        for name in all_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
            total = 0.0
            # Add all invoice amounts (debit)
            total += sum(float(inv.base_amount) for inv in invoices if inv.buyer_name.strip() == key)
            # Add all buyer amounts (debit)
            total += sum(float(b.amount) for b in buyers if b.name.strip() == key)
            # Subtract all company bill amounts (credit)
            total -= sum(float(cb.amount) for cb in companybills if cb.company.strip() == key)
            # Add all OtherTransaction (debit) amounts
            total += sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract all OtherTransaction (credit) amounts
            total -= sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            
            # Only include if amount is significantly different from zero
            if abs(total) > 0.01:
                sundry_dict[key] = total
        
        sundry_debtors_creditors = []
        for name, amount in sundry_dict.items():
            if amount > 0.01:
                sundry_debtors_creditors.append({"name": name, "amount": amount, "type": "Debtor"})
            elif amount < -0.01:
                sundry_debtors_creditors.append({"name": name, "amount": abs(amount), "type": "Creditor"})

        # Dynamic sections for OtherTransaction types + carry-forward
        sundry_keys_set = {k.strip().lower() for k in sundry_dict.keys()}
        dynamic_sections = {}
        
        other_types = OtherTransaction.objects.filter(
            date__gte=fy_start, 
            date__lte=fy_end
        ).exclude(
            type__iexact='partner'
        ).exclude(
            type__iexact='loan'
        ).exclude(
            type__iexact='fixed assets'
        ).exclude(
            type__iexact='unsecure loan'
        ).values_list('type', flat=True).distinct()
        
        # Add types from carry-forward
        carry_forward_types = set(carry_forward['dynamic_sections'].keys())
        all_types = set(other_types) | carry_forward_types
        
        for ot_type in all_types:
            if not ot_type or ot_type.strip().lower() in reserved_types or ot_type.strip().lower() in sundry_keys_set:
                continue
                
            type_key = ot_type.strip()
            credit_entries = []
            debit_entries = []
            
            type_transactions = OtherTransaction.objects.filter(
                type__iexact=type_key,
                date__gte=fy_start,
                date__lte=fy_end
            )
            
            for txn in type_transactions:
                display_name = txn.name or txn.notice or type_key
                amount = float(txn.amount)
                
                if txn.transaction_type == 'credit':
                    credit_entries.append([display_name, amount])
                elif txn.transaction_type == 'debit':
                    debit_entries.append([display_name, amount])
            
            # Add carry-forward amounts for this type
            if type_key in carry_forward['dynamic_sections']:
                carry_forward_data = carry_forward['dynamic_sections'][type_key]
                
                # Add credit carry-forward
                for name, amount in carry_forward_data['credit'].items():
                    if amount > 0.01:
                        credit_entries.append([f"{name} (Carry-forward)", amount])
                
                # Add debit carry-forward
                for name, amount in carry_forward_data['debit'].items():
                    if amount > 0.01:
                        debit_entries.append([f"{name} (Carry-forward)", amount])
            
            # Only include if there are entries
            if credit_entries or debit_entries:
                dynamic_sections[type_key] = {
                    'credit': credit_entries,
                    'debit': debit_entries
                }

        # Compose the response
        data = {
            "capital": capital,
            "loan_credit": loan_credit,
            "loan_debit": loan_debit,
            "unsecure_loan_credit": unsecure_loan_credit,
            "unsecure_loan_debit": unsecure_loan_debit,
            "fixed_assets_credit": fixed_assets,
            "fixed_assets_debit": [],
            "salary": salary,
            "salary_total": salary_total,
            "buyer": buyer,
            "buyer_total": buyer_total,
            "sundry_debtors_creditors": sundry_debtors_creditors,
            "dynamic_sections": dynamic_sections,
        }
        
        # Save or update the snapshot
        obj, created = BalanceSheet.objects.update_or_create(
            year=start_year,
            defaults={'data': data}
        )
        serializer = BalanceSheetSerializer(obj)
        return Response({"financial_year": fy, **serializer.data}, status=201 if created else 200)


class SettlementTestView(APIView):
    """API endpoint to test and show which accounts would be automatically settled"""
    def get(self, request):
        fy = request.query_params.get('financial_year')
        if fy:
            try:
                start_year, end_year = map(int, fy.split('-'))
            except Exception:
                return Response({'error': 'Invalid financial_year format. Use YYYY-YYYY.'}, status=400)
        else:
            today = timezone.now().date()
            if today.month >= 4:
                start_year = today.year
                end_year = today.year + 1
            else:
                start_year = today.year - 1
                end_year = today.year
            fy = f"{start_year}-{end_year}"
        
        fy_start = timezone.datetime(start_year, 4, 1).date()
        fy_end = timezone.datetime(end_year, 3, 31).date()
        
        # Get carry-forward amounts from previous years
        carry_forward = get_carry_forward_amounts(start_year, end_year)
        
        # Collect all names and their totals (including carry-forward)
        all_names = set()
        invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=False)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        companybills = CompanyBill.objects.filter(date__gte=fy_start, date__lte=fy_end)
        other_txns = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end)
        
        for inv in invoices:
            all_names.add(inv.buyer_name.strip())
        for b in buyers:
            all_names.add(b.name.strip())
        for cb in companybills:
            all_names.add(cb.company.strip())
        for ot in other_txns:
            if ot.name:
                all_names.add(ot.name.strip())
        
        # Add names from carry-forward
        for name in carry_forward['sundry_debtors_creditors'].keys():
            all_names.add(name.strip())
        
        # Reserved types
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        # Calculate totals for each name (including carry-forward)
        settlement_data = []
        for name in all_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
                
            total = 0.0
            # Add invoice amounts (debit)
            total += sum(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))) for inv in invoices if inv.buyer_name.strip() == key)
            # Add buyer amounts (debit)
            total += sum(float(b.amount) for b in buyers if b.name.strip() == key)
            # Subtract company bill amounts (credit)
            total -= sum(float(cb.amount) for cb in companybills if cb.company.strip() == key)
            # Add OtherTransaction debit amounts
            total += sum(float(ot.amount) for ot in other_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract OtherTransaction credit amounts
            total -= sum(float(ot.amount) for ot in other_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            
            # Add carry-forward amount
            if key in carry_forward['sundry_debtors_creditors']:
                total += carry_forward['sundry_debtors_creditors'][key]
            
            settlement_data.append({
                'name': key,
                'total_amount': round(total, 2),
                'status': 'Settled' if abs(total) <= 0.01 else 'Active',
                'type': 'Debtor' if total > 0.01 else 'Creditor' if total < -0.01 else 'Settled'
            })
        
        # Sort by status and amount
        settlement_data.sort(key=lambda x: (x['status'] == 'Settled', abs(x['total_amount'])), reverse=True)
        
        return Response({
            'financial_year': fy,
            'settlement_threshold': 0.01,
            'accounts': settlement_data,
            'summary': {
                'total_accounts': len(settlement_data),
                'settled_accounts': len([a for a in settlement_data if a['status'] == 'Settled']),
                'active_accounts': len([a for a in settlement_data if a['status'] == 'Active'])
            }
        }) 