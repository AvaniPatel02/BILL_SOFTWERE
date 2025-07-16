from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from num2words import num2words
from .models import Invoice
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

# Serializer for Invoice
class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        extra_kwargs = {
            'buyer_name': {'required': True},
            'buyer_address': {'required': True},
            'invoice_date': {'required': True},
            'base_amount': {'required': True},
        }

# ViewSet for CRUD operations
class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InvoiceCalculationView(APIView):
    """
    Receives invoice data, performs calculations, and returns results.
    Also generates the next invoice number for the given financial year.
    """
    def post(self, request):
        data = request.data

        # Extract fields
        country = data.get('country', 'India')
        state = data.get('state', 'Gujarat')
        total_hours = float(data.get('total_hours', 0) or 0)
        rate = float(data.get('rate', 0) or 0)
        base_amount = float(data.get('base_amount', 0) or 0)
        exchange_rate = float(data.get('exchange_rate', 1) or 1)
        financial_year = data.get('financial_year')

        # Calculate base amount if not provided
        if not base_amount and total_hours and rate:
            base_amount = total_hours * rate

        # Tax calculation
        cgst = sgst = igst = taxtotal = total_with_gst = 0

        if country == "India":
            if state == "Gujarat":
                cgst = sgst = round(base_amount * 0.09, 2)
                taxtotal = cgst + sgst
                total_with_gst = round(base_amount + taxtotal, 2)
            else:
                igst = round(base_amount * 0.18, 2)
                taxtotal = igst
                total_with_gst = round(base_amount + igst, 2)
        else:
            total_with_gst = base_amount
            cgst = sgst = igst = taxtotal = None  # Not applicable

        # Currency conversion (INR equivalent)
        inr_equivalent = None
        if country != "India" and exchange_rate:
            inr_equivalent = round(total_with_gst * exchange_rate, 2)

        # Amount in words (Indian style if possible)
        try:
            amount_in_words = num2words(int(round(total_with_gst)), lang='en_IN').title() + ' Only'
        except NotImplementedError:
            amount_in_words = num2words(int(round(total_with_gst)), lang='en').title() + ' Only'

        # Invoice number generation
        invoice_number = None
        if financial_year:
            # Find the latest invoice for the given financial year
            latest_invoice = Invoice.objects.filter(financial_year=financial_year).order_by('-invoice_number').first()
            if latest_invoice and latest_invoice.invoice_number:
                # Extract the numeric part and increment
                import re
                match = re.search(r'(\d+)', latest_invoice.invoice_number)
                if match:
                    next_num = int(match.group(1)) + 1
                    invoice_number = f"{str(next_num).zfill(2)}-{financial_year}"
                else:
                    invoice_number = f"01-{financial_year}"
            else:
                invoice_number = f"01-{financial_year}"

        return Response({
            "base_amount": base_amount,
            "cgst": cgst,
            "sgst": sgst,
            "igst": igst,
            "taxtotal": taxtotal,
            "total_with_gst": total_with_gst,
            "inr_equivalent": inr_equivalent,
            "amount_in_words": amount_in_words,
            "invoice_number": invoice_number,
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_invoice_number(request):
    current_date = datetime.now().date()
    if current_date.month >= 4:
        financial_year_start = current_date.year
    else:
        financial_year_start = current_date.year - 1
    financial_year_end = financial_year_start + 1
    financial_year = f"{financial_year_start}/{financial_year_end}"
    invoices = Invoice.objects.filter(
        financial_year=financial_year,
        user=request.user
    ).order_by('-invoice_number')
    print(f"[DEBUG] User: {request.user}, Financial Year: {financial_year}")
    print(f"[DEBUG] Found {invoices.count()} invoices for this user/year.")
    last_invoice = invoices.first()
    if last_invoice:
        print(f"[DEBUG] Last invoice number: {last_invoice.invoice_number}")
        try:
            num_part = last_invoice.invoice_number.split('-')[0]
            next_num = int(num_part) + 1
        except (ValueError, IndexError, AttributeError):
            next_num = 1
    else:
        print("[DEBUG] No previous invoice found. Starting at 1.")
        next_num = 1
    invoice_number = f"{next_num:02d}-{financial_year}"
    print(f"[DEBUG] Next invoice number to return: {invoice_number}")
    return Response({
        'invoice_number': invoice_number,
        'financial_year': financial_year
    })