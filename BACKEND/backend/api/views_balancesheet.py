from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice, Buyer, CompanyBill, Salary, OtherTransaction, BalanceSheet, ArchivedInvoice
from .serializers import BalanceSheetSerializer
from django.db.models import Sum
from collections import defaultdict
from django.utils import timezone

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

        # Capital (Partners) from OtherTransaction
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
        capital = [item for item in capital if item['amount'] != 0]

        # Loan Credit/Debit from OtherTransaction
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
        loan_credit = [item for item in loan if item['amount'] > 0]
        loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in loan if item['amount'] < 0]

        # Unsecure Loan Credit/Debit from OtherTransaction
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
        unsecure_loan_credit = [item for item in unsecure_loan if item['amount'] > 0]
        unsecure_loan_debit = [{'name': item['name'], 'amount': abs(item['amount']), 'bank_name': item['bank_name'], 'notice': item['notice']} for item in unsecure_loan if item['amount'] < 0]

        # Fixed Assets from OtherTransaction - Separate credit and debit
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
        fixed_assets_credit = [[k, v] for k, v in fixed_assets_credit_dict.items()]
        fixed_assets_debit = [[k, v] for k, v in fixed_assets_debit_dict.items()]

        # Salary
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += float(s.amount)
        salary = [[k, v] for k, v in salary_dict.items()]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors)
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += float(b.amount)
        buyer = [[k, v] for k, v in buyer_dict.items()]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        # Sundry Debtors/Creditors calculation (full accounting logic)
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
            # Add all OtherTransaction (debit) amounts
            total += sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'debit')
            # Subtract all OtherTransaction (credit) amounts
            total -= sum(float(ot.amount) for ot in other_buyer_txns if ot.name and ot.name.strip() == key and ot.transaction_type == 'credit')
            if abs(total) > 0.0001:
                sundry_dict[key] = total
        # 3. Build Sundry Debtors/Creditors list
        sundry_debtors_creditors = []
        for name, amount in sundry_dict.items():
            if amount > 0:
                sundry_debtors_creditors.append({"name": name, "amount": amount, "type": "Debtor"})
            else:
                sundry_debtors_creditors.append({"name": name, "amount": abs(amount), "type": "Creditor"})

        # Add deleted invoices to Unsecure Loan (Debit)
        deleted_invoices = Invoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end, is_deleted=True)
        for inv in deleted_invoices:
            unsecure_loan_debit.append({
                "name": inv.buyer_name,
                "amount": float(getattr(inv, 'total_tax_amount', getattr(inv, 'total_with_gst', 0))),
                "type": "Unsecure Loan"
            })
        # Add archived invoices to Unsecure Loan (Debit)
        archived_invoices = ArchivedInvoice.objects.filter(invoice_date__gte=fy_start, invoice_date__lte=fy_end)
        for inv in archived_invoices:
            unsecure_loan_debit.append({
                "name": inv.buyer_name,
                "amount": float(inv.total_tax_amount if inv.total_tax_amount is not None else (inv.total_with_gst or 0)),
                "type": "Unsecure Loan"
            })

        # Custom Types from OtherTransaction (excluding partner, loan, fixed assets, unsecure loan)
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
            amount = float(ct.amount)
            
            if ct.transaction_type == 'credit':
                custom_types_net[tkey][display_name] += amount
            elif ct.transaction_type == 'debit':
                custom_types_net[tkey][display_name] -= amount
        
        # Separate into credit and debit based on net amounts
        for type_key, name_amounts in custom_types_net.items():
            for name, net_amount in name_amounts.items():
                if abs(net_amount) > 0.0001:  # Only include non-zero amounts
                    if net_amount > 0:
                        custom_types_credit[type_key].append([name, net_amount])
                    else:
                        custom_types_debit[type_key].append([name, abs(net_amount)])
        
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
        # --- Copy the same calculation logic as in BalanceSheetView.get() ---
        # Capital (Partners) from OtherTransaction
        capital_dict = defaultdict(float)
        partners = OtherTransaction.objects.filter(type__iexact='partner', date__gte=fy_start, date__lte=fy_end)
        for p in partners:
            amt = float(p.amount)
            if p.transaction_type == 'credit':
                capital_dict[p.notice] += amt
            elif p.transaction_type == 'debit':
                capital_dict[p.notice] -= amt
        capital = [[k, v] for k, v in capital_dict.items()]

        # Loan Credit/Debit from OtherTransaction
        loan_dict = defaultdict(float)
        loans = OtherTransaction.objects.filter(type__iexact='loan', date__gte=fy_start, date__lte=fy_end)
        for l in loans:
            amt = float(l.amount)
            if l.transaction_type == 'credit':
                loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                loan_dict[l.notice] -= amt
        loan_credit = [[k, v] for k, v in loan_dict.items() if v > 0]
        loan_debit = [[k, abs(v)] for k, v in loan_dict.items() if v < 0]

        # Unsecure Loan Credit/Debit from OtherTransaction
        unsecure_loan_dict = defaultdict(float)
        unsecure_loans = OtherTransaction.objects.filter(type__iexact='unsecure loan', date__gte=fy_start, date__lte=fy_end)
        for l in unsecure_loans:
            amt = float(l.amount)
            if l.transaction_type == 'credit':
                unsecure_loan_dict[l.notice] += amt
            elif l.transaction_type == 'debit':
                unsecure_loan_dict[l.notice] -= amt
        unsecure_loan_credit = [[k, v] for k, v in unsecure_loan_dict.items() if v > 0]
        unsecure_loan_debit = [[k, abs(v)] for k, v in unsecure_loan_dict.items() if v < 0]

        # Fixed Assets from OtherTransaction
        fixed_assets_dict = defaultdict(float)
        assets = OtherTransaction.objects.filter(type__iexact='fixed assets', date__gte=fy_start, date__lte=fy_end)
        for a in assets:
            display_name = a.name or a.notice
            fixed_assets_dict[display_name] += float(a.amount)
        fixed_assets = [[k, v] for k, v in fixed_assets_dict.items()]

        # Salary
        salary_dict = defaultdict(float)
        salaries = Salary.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for s in salaries:
            salary_dict[s.name] += float(s.amount)
        salary = [[k, v] for k, v in salary_dict.items()]
        salary_total = sum(v for k, v in salary)

        # Buyer (Sundry Debtors)
        buyer_dict = defaultdict(float)
        buyers = Buyer.objects.filter(date__gte=fy_start, date__lte=fy_end)
        for b in buyers:
            buyer_dict[b.name] += float(b.amount)
        buyer = [[k, v] for k, v in buyer_dict.items()]
        buyer_total = sum(v for k, v in buyer)

        # Reserved types to exclude from Sundry Debtors/Creditors
        reserved_types = {t.strip().lower() for t in [
            'partner', 'loan', 'unsecure loan', 'fixed assets', 'assets', 'others'
        ]}
        # Sundry Debtors/Creditors calculation (full accounting logic)
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
        # Do NOT add OtherTransaction.type to all_names here!
        # 2. For each name, sum up all debits and credits as per the rules, but skip reserved types
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
            if abs(total) > 0.0001:
                sundry_dict[key] = total
        # 3. Build Sundry Debtors/Creditors list
        company_credit = []
        company_debit = []
        for name, amount in sundry_dict.items():
            if amount > 0:
                company_credit.append([name, amount])
            else:
                company_debit.append([name, abs(amount)])

        # Custom Types from OtherTransaction (excluding partner, loan, fixed assets, unsecure loan, and buyer-matched types)
        # Only include types not present in Sundry Debtors/Creditors
        sundry_keys_set = {k.strip().lower() for k in sundry_dict.keys()}
        custom_types_credit = defaultdict(list)
        custom_types_debit = defaultdict(list)
        custom_types = OtherTransaction.objects.filter(date__gte=fy_start, date__lte=fy_end).exclude(type__iexact='partner').exclude(type__iexact='loan').exclude(type__iexact='fixed assets').exclude(type__iexact='unsecure loan')
        for ct in custom_types:
            tkey = ct.type.strip() if ct.type else ''
            display_name = ct.name if ct.name else (ct.notice if ct.notice else "No Name")
            if not tkey or tkey.lower() in sundry_keys_set:
                continue
            if ct.transaction_type == 'credit':
                custom_types_credit[tkey].append([display_name, float(ct.amount)])
            elif ct.transaction_type == 'debit':
                custom_types_debit[tkey].append([display_name, float(ct.amount)])
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