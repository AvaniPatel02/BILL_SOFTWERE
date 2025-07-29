"""
Balance Sheet Views with Unsettled Entries Support

This module provides balance sheet functionality that includes unsettled entries from previous years
in the current year's balance sheet. This ensures that:

1. Tax invoices that are not settled (unpaid) from previous years appear in the current year's balance sheet
2. All balance sheet entries that are not settled (credit/debit calculation ≠ 0) are carried forward to the current year
3. The balance sheet shows a complete picture of all outstanding amounts regardless of when they were created

The get_unsettled_entries() method calculates all unsettled amounts from before the current financial year
and includes them in the current year's calculations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice, Buyer, CompanyBill, Salary, OtherTransaction, BalanceSheet, ArchivedInvoice
from .serializers import BalanceSheetSerializer
from django.db.models import Sum
from collections import defaultdict
from django.utils import timezone

class BalanceSheetView(APIView):
    def get_unsettled_entries(self, current_fy_start):
        """
        Calculate unsettled entries from all previous years up to current financial year start
        Returns unsettled amounts for each category
        """
        unsettled_data = {
            'capital': [],
            'loan_credit': [],
            'loan_debit': [],
            'unsecure_loan_credit': [],
            'unsecure_loan_debit': [],
            'fixed_assets_credit': defaultdict(float),
            'fixed_assets_debit': defaultdict(float),
            'salary': defaultdict(float),
            'sundry_debtors_creditors': [],
            'custom_types_credit': defaultdict(lambda: defaultdict(float)),
            'custom_types_debit': defaultdict(lambda: defaultdict(float)),
        }
        
        # Get all data from before current financial year
        previous_partners = OtherTransaction.objects.filter(
            type__iexact='partner', 
            date__lt=current_fy_start
        )
        for p in previous_partners:
            amt = round(float(p.amount))  # Round to whole number
            # Prioritize name field, then notice, only use generic name as last resort
            if p.name and p.name.strip():
                name = p.name.strip()
            elif p.notice and p.notice.strip():
                name = p.notice.strip()
            else:
                name = f"Partner_{p.id}"  # Only use generic name if no other name is available
            # Add each partner transaction individually (don't aggregate by name)
            unsettled_data['capital'].append({
                'name': name,
                'amount': amt if p.transaction_type == 'credit' else -amt,
                'notice': p.notice,
            })
        
        # Filter out zero amounts from capital
        unsettled_data['capital'] = [item for item in unsettled_data['capital'] if abs(item['amount']) > 0.50]
        
        # Previous loans
        previous_loans = OtherTransaction.objects.filter(
            type__iexact='loan', 
            date__lt=current_fy_start
        )
        for l in previous_loans:
            amt = round(float(l.amount))  # Round to whole number
            name = l.bank_name or l.notice
            found = next((item for item in unsettled_data['loan_credit'] + unsettled_data['loan_debit'] if item['name'] == name), None)
            if found:
                found['amount'] += amt if l.transaction_type == 'credit' else -amt
            else:
                if l.transaction_type == 'credit':
                    unsettled_data['loan_credit'].append({
                        'name': name,
                        'amount': amt,
                        'bank_name': l.bank_name,
                        'notice': l.notice,
                    })
                else:
                    unsettled_data['loan_debit'].append({
                        'name': name,
                        'amount': amt,
                        'bank_name': l.bank_name,
                        'notice': l.notice,
                    })
        
        # Filter out zero amounts from loans
        unsettled_data['loan_credit'] = [item for item in unsettled_data['loan_credit'] if abs(item['amount']) > 0.50]
        unsettled_data['loan_debit'] = [item for item in unsettled_data['loan_debit'] if abs(item['amount']) > 0.50]
        
        # Previous unsecure loans
        previous_unsecure_loans = OtherTransaction.objects.filter(
            type__iexact='unsecure loan', 
            date__lt=current_fy_start
        )
        for l in previous_unsecure_loans:
            amt = round(float(l.amount))  # Round to whole number
            name = l.name or l.notice
            found = next((item for item in unsettled_data['unsecure_loan_credit'] + unsettled_data['unsecure_loan_debit'] if item['name'] == name), None)
            if found:
                found['amount'] += amt if l.transaction_type == 'credit' else -amt
            else:
                if l.transaction_type == 'credit':
                    unsettled_data['unsecure_loan_credit'].append({
                        'name': name,
                        'amount': amt,
                        'bank_name': l.bank_name,
                        'notice': l.notice,
                    })
                else:
                    unsettled_data['unsecure_loan_debit'].append({
                        'name': name,
                        'amount': amt,
                        'bank_name': l.bank_name,
                        'notice': l.notice,
                    })
        
        # Filter out zero amounts from unsecure loans
        unsettled_data['unsecure_loan_credit'] = [item for item in unsettled_data['unsecure_loan_credit'] if abs(item['amount']) > 0.50]
        unsettled_data['unsecure_loan_debit'] = [item for item in unsettled_data['unsecure_loan_debit'] if abs(item['amount']) > 0.50]
        
        # Previous fixed assets
        previous_assets = OtherTransaction.objects.filter(
            type__iexact='fixed assets', 
            date__lt=current_fy_start
        )
        for a in previous_assets:
            display_name = a.name or a.notice
            amount = round(float(a.amount))  # Round to whole number
            if a.transaction_type == 'credit':
                unsettled_data['fixed_assets_credit'][display_name] += amount
            else:
                unsettled_data['fixed_assets_debit'][display_name] += amount
        
        # Filter out zero amounts from fixed assets
        unsettled_data['fixed_assets_credit'] = defaultdict(float, {k: v for k, v in unsettled_data['fixed_assets_credit'].items() if abs(v) > 0.50})
        unsettled_data['fixed_assets_debit'] = defaultdict(float, {k: v for k, v in unsettled_data['fixed_assets_debit'].items() if abs(v) > 0.50})
        
        # Previous salaries
        previous_salaries = Salary.objects.filter(date__lt=current_fy_start)
        for s in previous_salaries:
            unsettled_data['salary'][s.name] += round(float(s.amount))  # Round to whole number
        
        # Filter out zero amounts from salary
        unsettled_data['salary'] = defaultdict(float, {k: v for k, v in unsettled_data['salary'].items() if abs(v) > 0.50})
        
        # Previous invoices, buyers, company bills for sundry debtors/creditors
        previous_invoices = Invoice.objects.filter(
            invoice_date__lt=current_fy_start, 
            is_deleted=False
        )
        previous_buyers = Buyer.objects.filter(date__lt=current_fy_start)
        previous_companybills = CompanyBill.objects.filter(date__lt=current_fy_start)
        previous_other_txns = OtherTransaction.objects.filter(date__lt=current_fy_start)
        
        # Calculate previous sundry debtors/creditors
        all_previous_names = set()
        for inv in previous_invoices:
            all_previous_names.add(inv.buyer_name.strip())
        for b in previous_buyers:
            all_previous_names.add(b.name.strip())
        for cb in previous_companybills:
            all_previous_names.add(cb.company.strip())
        for ot in previous_other_txns:
            if ot.name:
                all_previous_names.add(ot.name.strip())
        
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        previous_sundry_dict = {}
        for name in all_previous_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
            total = 0.0
            # Add all previous invoice amounts (debit)
            total += sum(round(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))) for inv in previous_invoices if inv.buyer_name.strip() == key)
            # Add all previous buyer amounts (debit)
            total += sum(round(float(b.amount)) for b in previous_buyers if b.name.strip() == key)
            # Subtract all previous company bill amounts (credit)
            total -= sum(round(float(cb.amount)) for cb in previous_companybills if cb.company.strip() == key)
            # Add all previous OtherTransaction (debit) amounts
            total += sum(round(float(ot.amount)) for ot in previous_other_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract all previous OtherTransaction (credit) amounts
            total -= sum(round(float(ot.amount)) for ot in previous_other_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            if abs(total) > 0.50:  # Updated threshold
                previous_sundry_dict[key] = round(total)  # Round final total
        
        # Build previous sundry debtors/creditors
        for name, amount in previous_sundry_dict.items():
            if amount > 0:
                unsettled_data['sundry_debtors_creditors'].append({"name": name, "amount": amount, "type": "Debtor"})
            else:
                unsettled_data['sundry_debtors_creditors'].append({"name": name, "amount": abs(amount), "type": "Creditor"})
        
        # Previous custom types
        previous_custom_types = OtherTransaction.objects.filter(
            date__lt=current_fy_start
        ).exclude(type__iexact='partner').exclude(type__iexact='loan').exclude(type__iexact='fixed assets').exclude(type__iexact='unsecure loan')
        
        for ct in previous_custom_types:
            tkey = ct.type.strip() if ct.type else ''
            if not tkey or tkey.lower() in {k.strip().lower() for k in previous_sundry_dict.keys()}:
                continue
            display_name = ct.name if ct.name else (ct.notice if ct.notice else f"Unknown_{ct.id}")
            amount = round(float(ct.amount))  # Round to whole number
            
            if ct.transaction_type == 'credit':
                unsettled_data['custom_types_credit'][tkey][display_name] += amount
            elif ct.transaction_type == 'debit':
                unsettled_data['custom_types_debit'][tkey][display_name] += amount
        
        # Filter out zero amounts from custom types
        for tkey in list(unsettled_data['custom_types_credit'].keys()):
            unsettled_data['custom_types_credit'][tkey] = {k: v for k, v in unsettled_data['custom_types_credit'][tkey].items() if abs(v) > 0.50}
            if not unsettled_data['custom_types_credit'][tkey]:
                del unsettled_data['custom_types_credit'][tkey]
        
        for tkey in list(unsettled_data['custom_types_debit'].keys()):
            unsettled_data['custom_types_debit'][tkey] = {k: v for k, v in unsettled_data['custom_types_debit'][tkey].items() if abs(v) > 0.50}
            if not unsettled_data['custom_types_debit'][tkey]:
                del unsettled_data['custom_types_debit'][tkey]
        
        # Previous deleted and archived invoices
        previous_deleted_invoices = Invoice.objects.filter(
            invoice_date__lt=current_fy_start, 
            is_deleted=True
        )
        for inv in previous_deleted_invoices:
            amount = round(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))))  # Round to whole number
            if abs(amount) > 0.50:  # Only add if amount is significant
                unsettled_data['unsecure_loan_debit'].append({
                    "name": inv.buyer_name,
                    "amount": amount,
                    "type": "Unsecure Loan"
                })
        
        previous_archived_invoices = ArchivedInvoice.objects.filter(
            invoice_date__lt=current_fy_start
        )
        for inv in previous_archived_invoices:
            amount = round(float(inv.total_tax_amount if inv.total_tax_amount is not None else (inv.total_with_gst or 0)))  # Round to whole number
            if abs(amount) > 0.50:  # Only add if amount is significant
                unsettled_data['unsecure_loan_debit'].append({
                    "name": inv.buyer_name,
                    "amount": amount,
                    "type": "Unsecure Loan"
                })
        
        return unsettled_data

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

        # Get unsettled entries from previous years
        unsettled_entries = self.get_unsettled_entries(fy_start)

        # Capital (Partners) from OtherTransaction - Current year + unsettled
        capital = []
        partners = OtherTransaction.objects.filter(type__iexact='partner', date__gte=fy_start, date__lte=fy_end)
        for p in partners:
            amt = round(float(p.amount))  # Round to whole number
            # Prioritize name field, then notice, only use generic name as last resort
            if p.name and p.name.strip():
                name = p.name.strip()
            elif p.notice and p.notice.strip():
                name = p.notice.strip()
            else:
                name = f"Partner_{p.id}"  # Only use generic name if no other name is available
            # Add each partner transaction individually (don't aggregate by name)
            capital.append({
                'name': name,
                'amount': amt if p.transaction_type == 'credit' else -amt,
                'notice': p.notice,
            })
        
        # Add unsettled capital entries
        for unsettled_cap in unsettled_entries['capital']:
            capital.append(unsettled_cap)
        
        # Filter out zero amounts (fully settled entries)
        capital = [item for item in capital if abs(item['amount']) > 0.50]

        # Loan Credit/Debit from OtherTransaction - Current year + unsettled
        loan = []
        loans = OtherTransaction.objects.filter(type__iexact='loan', date__gte=fy_start, date__lte=fy_end)
        for l in loans:
            amt = round(float(l.amount))  # Round to whole number
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
        
        # Add unsettled loan entries
        for unsettled_loan in unsettled_entries['loan_credit'] + unsettled_entries['loan_debit']:
            found = next((item for item in loan if item['name'] == unsettled_loan['name']), None)
            if found:
                found['amount'] += unsettled_loan['amount']
            else:
                loan.append(unsettled_loan)
        
        # Filter out zero amounts and separate credit/debit
        loan = [item for item in loan if abs(item['amount']) > 0.50]
        loan_credit = [item for item in loan if item['amount'] > 0]
        loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in loan if item['amount'] < 0]

        # Unsecure Loan Credit/Debit from OtherTransaction - Current year + unsettled
        unsecure_loan = []
        unsecure_loans = OtherTransaction.objects.filter(type__iexact='unsecure loan', date__gte=fy_start, date__lte=fy_end)
        for l in unsecure_loans:
            amt = round(float(l.amount))  # Round to whole number
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
        
        # Add unsettled unsecure loan entries
        for unsettled_unsecure in unsettled_entries['unsecure_loan_credit'] + unsettled_entries['unsecure_loan_debit']:
            found = next((item for item in unsecure_loan if item['name'] == unsettled_unsecure['name']), None)
            if found:
                found['amount'] += unsettled_unsecure['amount']
            else:
                unsecure_loan.append(unsettled_unsecure)
        
        # Filter out zero amounts and separate credit/debit
        unsecure_loan = [item for item in unsecure_loan if abs(item['amount']) > 0.50]
        unsecure_loan_credit = [item for item in unsecure_loan if item['amount'] > 0]
        unsecure_loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in unsecure_loan if item['amount'] < 0]

        # Fixed Assets from OtherTransaction - Current year + unsettled
        fixed_assets_credit_dict = defaultdict(float)
        fixed_assets_debit_dict = defaultdict(float)
        assets = OtherTransaction.objects.filter(type__iexact='fixed assets', date__gte=fy_start, date__lte=fy_end)
        for a in assets:
            display_name = a.name or a.notice
            amount = round(float(a.amount))  # Round to whole number
            if a.transaction_type == 'credit':
                fixed_assets_credit_dict[display_name] += amount
            else:
                fixed_assets_debit_dict[display_name] += amount
        
        # Add unsettled fixed assets
        for name, amount in unsettled_entries['fixed_assets_credit'].items():
            fixed_assets_credit_dict[name] += amount
        for name, amount in unsettled_entries['fixed_assets_debit'].items():
            fixed_assets_debit_dict[name] += amount
        
        # Filter out zero amounts
        fixed_assets_credit = [[k, v] for k, v in fixed_assets_credit_dict.items() if abs(v) > 0.0001]
        fixed_assets_debit = [[k, v] for k, v in fixed_assets_debit_dict.items() if abs(v) > 0.0001]

        # Salary - Current year + unsettled
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += round(float(s.amount))  # Round to whole number
        
        # Add unsettled salary
        for name, amount in unsettled_entries['salary'].items():
            salary_dict[name] += amount
        
        # Filter out zero amounts
        salary = [[k, v] for k, v in salary_dict.items() if abs(v) > 0.50]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors) - Current year only (handled in sundry calculation)
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += round(float(b.amount))  # Round to whole number
        buyer = [[k, v] for k, v in buyer_dict.items()]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        # Sundry Debtors/Creditors calculation (full accounting logic) - Current year + unsettled
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
        for ot in other_buyer_txns:
            if ot.type:
                all_names.add(ot.type.strip())
        
        # Add names from unsettled entries
        for entry in unsettled_entries['sundry_debtors_creditors']:
            all_names.add(entry['name'].strip())
        
        # 2. For each name, sum up all debits and credits as per the rules, but skip reserved types
        sundry_dict = {}
        for name in all_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
            total = 0.0
            # Add all invoice amounts (debit) - current year
            total += sum(round(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))) for inv in invoices if inv.buyer_name.strip() == key)
            # Add all buyer amounts (debit) - current year
            total += sum(round(float(b.amount)) for b in buyers if b.name.strip() == key)
            # Subtract all company bill amounts (credit) - current year
            total -= sum(round(float(cb.amount)) for cb in companybills if cb.company.strip() == key)
            # Add all OtherTransaction (debit) amounts - current year
            total += sum(round(float(ot.amount)) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract all OtherTransaction (credit) amounts - current year
            total -= sum(round(float(ot.amount)) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            
            # Add unsettled amounts for this name
            for entry in unsettled_entries['sundry_debtors_creditors']:
                if entry['name'].strip() == key:
                    if entry['type'] == 'Debtor':
                        total += entry['amount']
                    else:
                        total -= entry['amount']
            
            # Only include entries with non-zero amounts (not fully settled)
            if abs(total) > 0.50:
                sundry_dict[key] = round(total)
        
        # 3. Build Sundry Debtors/Creditors list (only non-zero amounts)
        sundry_debtors_creditors = []
        for name, amount in sundry_dict.items():
            if amount > 0:
                sundry_debtors_creditors.append({"name": name, "amount": amount, "type": "Debtor"})
            else:
                sundry_debtors_creditors.append({"name": name, "amount": abs(amount), "type": "Creditor"})

        # Add deleted invoices to Unsecure Loan (Debit) - Current year + unsettled
        deleted_invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=True)
        for inv in deleted_invoices:
            amount = round(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))))  # Round to whole number
            if abs(amount) > 0.50:  # Only add if amount is significant
                unsecure_loan_debit.append({
                    "name": inv.buyer_name,
                    "amount": amount,
                    "type": "Unsecure Loan"
                })
        
        # Add archived invoices to Unsecure Loan (Debit) - Current year + unsettled
        archived_invoices = ArchivedInvoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end)
        for inv in archived_invoices:
            amount = round(float(inv.total_tax_amount if inv.total_tax_amount is not None else (inv.total_with_gst or 0)))  # Round to whole number
            if abs(amount) > 0.50:  # Only add if amount is significant
                unsecure_loan_debit.append({
                    "name": inv.buyer_name,
                    "amount": amount,
                    "type": "Unsecure Loan"
                })

        # Custom Types from OtherTransaction - Current year + unsettled
        sundry_keys_set = {k.strip().lower() for k in sundry_dict.keys()}
        custom_types_credit = defaultdict(list)
        custom_types_debit = defaultdict(list)
        custom_types = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end).exclude(type__iexact='partner').exclude(type__iexact='loan').exclude(type__iexact='fixed assets').exclude(type__iexact='unsecure loan')
        
        # Group by type and name to calculate net amounts
        custom_types_net = defaultdict(lambda: defaultdict(float))
        
        for ct in custom_types:
            tkey = ct.type.strip() if ct.type else ''
            if not tkey or tkey.lower() in sundry_keys_set:
                continue
            # Prioritize name field, then notice, but never use type name as display name
            display_name = ct.name if ct.name else (ct.notice if ct.notice else f"Unknown_{ct.id}")
            amount = round(float(ct.amount))  # Round to whole number
            
            if ct.transaction_type == 'credit':
                custom_types_net[tkey][display_name] += amount
            elif ct.transaction_type == 'debit':
                custom_types_net[tkey][display_name] -= amount
        
        # Add unsettled custom types
        for type_key, name_amounts in unsettled_entries['custom_types_credit'].items():
            for name, amount in name_amounts.items():
                custom_types_net[type_key][name] += amount
        
        for type_key, name_amounts in unsettled_entries['custom_types_debit'].items():
            for name, amount in name_amounts.items():
                custom_types_net[type_key][name] -= amount
        
        # Separate into credit and debit based on net amounts (only non-zero amounts)
        for type_key, name_amounts in custom_types_net.items():
            for name, net_amount in name_amounts.items():
                if abs(net_amount) > 0.50:  # Only include non-zero amounts (not fully settled)
                    if net_amount > 0:
                        custom_types_credit[type_key].append([name, round(net_amount)])  # Round to whole number
                    else:
                        custom_types_debit[type_key].append([name, round(abs(net_amount))])  # Round to whole number
        
        # Remove any empty or zero groups
        custom_types_credit = {k: v for k, v in custom_types_credit.items() if v}
        custom_types_debit = {k: v for k, v in custom_types_debit.items() if v}

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
            "custom_types_credit": dict(custom_types_credit),
            "custom_types_debit": dict(custom_types_debit),
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
        
        # Get unsettled entries from previous years
        balance_sheet_view = BalanceSheetView()
        unsettled_entries = balance_sheet_view.get_unsettled_entries(fy_start)
        
        # --- Copy the same calculation logic as in BalanceSheetView.get() ---
        # Capital (Partners) from OtherTransaction - Current year + unsettled
        capital_dict = defaultdict(float)
        partners = OtherTransaction.objects.filter(type__iexact='partner', date__gte=fy_start, date__lte=fy_end)
        for p in partners:
            amt = round(float(p.amount))  # Round to whole number
            # Prioritize name field, then notice, only use generic name as last resort
            if p.name and p.name.strip():
                name = p.name.strip()
            elif p.notice and p.notice.strip():
                name = p.notice.strip()
            else:
                name = f"Partner_{p.id}"  # Only use generic name if no other name is available
            # Add each partner transaction individually (don't aggregate by name)
            capital_dict[f"{name}_{p.id}"] = amt if p.transaction_type == 'credit' else -amt
        
        # Add unsettled capital entries
        for unsettled_cap in unsettled_entries['capital']:
            capital_dict[f"{unsettled_cap['notice'] or unsettled_cap['name']}_{len(capital_dict)}"] = unsettled_cap['amount']
        
        # Filter out zero amounts (fully settled entries)
        capital = [[k.split('_')[0], v] for k, v in capital_dict.items() if abs(v) > 0.50]

        # Loan Credit/Debit from OtherTransaction - Current year + unsettled
        loan_dict = defaultdict(float)
        loans = OtherTransaction.objects.filter(type__iexact='loan', date__gte=fy_start, date__lte=fy_end)
        for l in loans:
            amt = round(float(l.amount))  # Round to whole number
            if l.transaction_type == 'credit':
                loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                loan_dict[l.notice] -= amt
        
        # Add unsettled loan entries
        for unsettled_loan in unsettled_entries['loan_credit'] + unsettled_entries['loan_debit']:
            loan_dict[unsettled_loan['notice'] or unsettled_loan['name']] += unsettled_loan['amount']
        
        # Filter out zero amounts and separate credit/debit
        loan_dict = {k: v for k, v in loan_dict.items() if abs(v) > 0.50}
        loan_credit = [[k, v] for k, v in loan_dict.items() if v > 0]
        loan_debit = [[k, abs(v)] for k, v in loan_dict.items() if v < 0]

        # Unsecure Loan Credit/Debit from OtherTransaction - Current year + unsettled
        unsecure_loan_dict = defaultdict(float)
        unsecure_loans = OtherTransaction.objects.filter(type__iexact='unsecure loan', date__gte=fy_start, date__lte=fy_end)
        for l in unsecure_loans:
            amt = round(float(l.amount))  # Round to whole number
            if l.transaction_type == 'credit':
                unsecure_loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                unsecure_loan_dict[l.notice] -= amt
        
        # Add unsettled unsecure loan entries
        for unsettled_unsecure in unsettled_entries['unsecure_loan_credit'] + unsettled_entries['unsecure_loan_debit']:
            unsecure_loan_dict[unsettled_unsecure['notice'] or unsettled_unsecure['name']] += unsettled_unsecure['amount']
        
        # Filter out zero amounts and separate credit/debit
        unsecure_loan_dict = {k: v for k, v in unsecure_loan_dict.items() if abs(v) > 0.50}
        unsecure_loan_credit = [[k, v] for k, v in unsecure_loan_dict.items() if v > 0]
        unsecure_loan_debit = [[k, abs(v)] for k, v in unsecure_loan_dict.items() if v < 0]

        # Fixed Assets from OtherTransaction - Current year + unsettled
        fixed_assets_dict = defaultdict(float)
        assets = OtherTransaction.objects.filter(type__iexact='fixed assets', date__gte=fy_start, date__lte=fy_end)
        for a in assets:
            display_name = a.name or a.notice
            fixed_assets_dict[display_name] += round(float(a.amount))  # Round to whole number
        
        # Add unsettled fixed assets
        for name, amount in unsettled_entries['fixed_assets_credit'].items():
            fixed_assets_dict[name] += amount
        for name, amount in unsettled_entries['fixed_assets_debit'].items():
            fixed_assets_dict[name] += amount
        
        # Filter out zero amounts
        fixed_assets = [[k, v] for k, v in fixed_assets_dict.items() if abs(v) > 0.50]

        # Salary - Current year + unsettled
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += round(float(s.amount))  # Round to whole number
        
        # Add unsettled salary
        for name, amount in unsettled_entries['salary'].items():
            salary_dict[name] += amount
        
        # Filter out zero amounts
        salary = [[k, v] for k, v in salary_dict.items() if abs(v) > 0.50]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors) - Current year only (handled in sundry calculation)
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += round(float(b.amount))  # Round to whole number
        buyer = [[k, v] for k, v in buyer_dict.items()]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        
        # Sundry Debtors/Creditors calculation (full accounting logic) - Current year + unsettled
        # 1. Collect all unique buyer/company names from invoices, buyers, company bills
        all_names = set()
        invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end)
        for inv in invoices:
            all_names.add(inv.buyer_name.strip().lower())
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            all_names.add(b.name.strip().lower())
        companybills = CompanyBill.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for cb in companybills:
            all_names.add(cb.company.strip().lower())
        other_buyer_txns = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end)
        
        # Add names from unsettled entries
        for entry in unsettled_entries['sundry_debtors_creditors']:
            all_names.add(entry['name'].strip().lower())
        
        # 2. For each name, sum up all debits and credits as per the rules, but skip reserved types
        sundry_dict = {}
        for name in all_names:
            key = name.strip()
            if key.lower() in reserved_types:
                continue
            total = 0.0
            # Add all invoice amounts (debit) - current year
            total += sum(round(float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0)))) for inv in invoices if inv.buyer_name.strip() == key)
            # Add all buyer amounts (debit) - current year
            total += sum(round(float(b.amount)) for b in buyers if b.name.strip() == key)
            # Subtract all company bill amounts (credit) - current year
            total -= sum(round(float(cb.amount)) for cb in companybills if cb.company.strip() == key)
            # Add all OtherTransaction (debit) amounts - current year
            total += sum(round(float(ot.amount)) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract all OtherTransaction (credit) amounts - current year
            total -= sum(round(float(ot.amount)) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            
            # Add unsettled amounts for this name
            for entry in unsettled_entries['sundry_debtors_creditors']:
                if entry['name'].strip().lower() == key.lower():
                    if entry['type'] == 'Debtor':
                        total += entry['amount']
                    else:
                        total -= entry['amount']
            
            # Only include entries with non-zero amounts (not fully settled)
            if abs(total) > 0.50:
                sundry_dict[key] = round(total)  # Round final total
        
        # 3. Build Sundry Debtors/Creditors list (only non-zero amounts)
        company_credit = []
        company_debit = []
        for name, amount in sundry_dict.items():
            if amount > 0:
                company_credit.append([name, amount])
            else:
                company_debit.append([name, abs(amount)])

        # Custom Types from OtherTransaction - Current year + unsettled
        # Only include types not present in Sundry Debtors/Creditors
        sundry_keys_set = {k.strip().lower() for k in sundry_dict.keys()}
        custom_types_credit = defaultdict(list)
        custom_types_debit = defaultdict(list)
        custom_types = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end).exclude(type__iexact='partner').exclude(type__iexact='loan').exclude(type__iexact='fixed assets').exclude(type__iexact='unsecure loan')
        
        # Group by type and name to calculate net amounts
        custom_types_net = defaultdict(lambda: defaultdict(float))
        
        for ct in custom_types:
            tkey = ct.type.strip() if ct.type else ''
            display_name = ct.name if ct.name else (ct.notice if ct.notice else "No Name")
            if not tkey or tkey.lower() in sundry_keys_set:
                continue
            if ct.transaction_type == 'credit':
                custom_types_net[tkey][display_name] += round(float(ct.amount))  # Round to whole number
            elif ct.transaction_type == 'debit':
                custom_types_net[tkey][display_name] -= round(float(ct.amount))  # Round to whole number
        
        # Add unsettled custom types
        for type_key, name_amounts in unsettled_entries['custom_types_credit'].items():
            for name, amount in name_amounts.items():
                custom_types_net[type_key][name] += amount
        
        for type_key, name_amounts in unsettled_entries['custom_types_debit'].items():
            for name, amount in name_amounts.items():
                custom_types_net[type_key][name] -= amount
        
        # Separate into credit and debit based on net amounts (only non-zero amounts)
        for type_key, name_amounts in custom_types_net.items():
            for name, net_amount in name_amounts.items():
                if abs(net_amount) > 0.50:  # Only include non-zero amounts (not fully settled)
                    if net_amount > 0:
                        custom_types_credit[type_key].append([name, round(net_amount)])  # Round to whole number
                    else:
                        custom_types_debit[type_key].append([name, round(abs(net_amount))])  # Round to whole number

        # Compose the response
        data = {
            "capital": capital,
            "loan_credit": loan_credit,
            "loan_debit": loan_debit,
            "unsecure_loan_credit": unsecure_loan_credit,
            "unsecure_loan_debit": unsecure_loan_debit,
            "fixed_assets": fixed_assets,
            "salary": salary,
            "salary_total": salary_total,
            "company_credit": company_credit,
            "company_debit": company_debit,
            "custom_types_credit": dict(custom_types_credit),
            "custom_types_debit": dict(custom_types_debit),
        }
        # Save or update the snapshot
        obj, created = BalanceSheet.objects.update_or_create(
            year=start_year,
            defaults={'data': data}
        )
        serializer = BalanceSheetSerializer(obj)
        return Response({"financial_year": fy, **serializer.data}, status=201 if created else 200) 