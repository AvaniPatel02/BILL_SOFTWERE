from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from num2words import num2words
from .models import Invoice
from rest_framework import serializers

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
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

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
            amount_in_words = num2words(total_with_gst, lang='en_IN').title() + ' Only'
        except NotImplementedError:
            amount_in_words = num2words(total_with_gst, lang='en').title() + ' Only'

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