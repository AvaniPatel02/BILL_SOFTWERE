from .models import Employee
from .models import Invoice
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OTP
from .models import Profile
from .models import Settings
from .models import BankAccount, CashEntry
from .models import Buyer
from .models import CompanyBill, BuyerBill, Salary, OtherTransaction
from .models import EmployeeActionHistory
from .models import OtherType
from .models import BalanceSheet
from .models import OtherName

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'mobile')

class LoginResponseSerializer(serializers.ModelSerializer):
    tokens = serializers.SerializerMethodField()
    hashed_password = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'mobile', 'tokens', 'hashed_password')
    
    def get_tokens(self, obj):
        refresh = RefreshToken.for_user(obj)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    def get_hashed_password(self, obj):
        # Return the hashed password from the database
        return obj.password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    mobile = serializers.CharField(required=True, max_length=10)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'mobile', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if len(attrs['mobile']) != 10:
            raise serializers.ValidationError({"mobile": "Mobile number must be 10 digits"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # This will automatically hash the password using Django's create_user method
        user = User.objects.create_user(**validated_data)
        return user

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ['email', 'otp_code', 'created_at', 'is_verified']
        read_only_fields = ['created_at', 'is_verified']

class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    mobile = serializers.CharField(source='user.mobile', required=False)
    email = serializers.EmailField(source='user.email', read_only=True)  # Email stays read-only here

    class Meta:
        model = Profile
        fields = ['first_name', 'mobile', 'email', 'image1', 'image2']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'mobile' in user_data:
            user.mobile = user_data['mobile']
        user.save()
        return super().update(instance, validated_data)

class SettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Settings
        fields = [
            'company_name', 'seller_pan', 'seller_address', 'seller_gstin', 'seller_email',
            'bank_name', 'account_number', 'ifsc_code', 'bank_account_holder', 'branch',
            'swift_code', 'HSN_codes', 'logo', 'logo_url'
        ]

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and hasattr(obj.logo, 'url'):
            return request.build_absolute_uri(obj.logo.url)
        return ""

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        for field in self.Meta.fields:
            if rep[field] is None:
                if field == "HSN_codes":
                    rep[field] = []
                else:
                    rep[field] = ""
        return rep

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'bank_name', 'account_number', 'amount']

class CashEntrySerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%Y-%m-%d'])

    class Meta:
        model = CashEntry
        fields = ['id', 'amount', 'date', 'description']

class EmployeeSerializer(serializers.ModelSerializer):
    joining_date = serializers.DateField(format='%Y-%m-%d', input_formats=['%Y-%m-%d'])

    class Meta:
        model = Employee
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'user', 'buyer_name', 'buyer_address', 'buyer_gst',
            'consignee_name', 'consignee_address', 'consignee_gst',
            'financial_year', 'invoice_number', 'invoice_date',
            'delivery_note', 'payment_mode', 'delivery_note_date',
            'destination', 'terms_to_delivery', 'country', 'currency',
            'currency_symbol', 'state', 'particulars', 'total_hours',
            'rate', 'base_amount', 'total_amount', 'cgst', 'sgst', 'igst',
            'total_with_gst', 'amount_in_words', 'taxtotal', 'remark',
            'exchange_rate', 'inr_equivalent', 'created_at', 'updated_at',
            'country_flag'
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Force dd-mm-yyyy for invoice_date
        if instance.invoice_date:
            rep['invoice_date'] = instance.invoice_date.strftime('%d-%m-%Y')
        else:
            rep['invoice_date'] = ''
        # Force dd-mm-yyyy for delivery_note_date if present
        if instance.delivery_note_date:
            rep['delivery_note_date'] = instance.delivery_note_date.strftime('%d-%m-%Y')
        else:
            rep['delivery_note_date'] = ''
        # Optionally format created_at and updated_at
        if instance.created_at:
            rep['created_at'] = instance.created_at.strftime('%d-%m-%Y')
        if instance.updated_at:
            rep['updated_at'] = instance.updated_at.strftime('%d-%m-%Y')
        return rep

class BuyerSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    class Meta:
        model = Buyer
        fields = ['id', 'user', 'name', 'date', 'amount', 'notes', 'payment_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_date(self, obj):
        return obj.date.strftime('%d-%m-%Y') if obj.date else ''

class CompanyBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBill
        fields = '__all__'

class BuyerBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerBill
        fields = '__all__'

class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = '__all__'

class OtherTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherTransaction
        fields = ['id', 'user', 'type', 'date', 'amount', 'notice', 'payment_type', 'bank', 'transaction_type', 'bank_name', 'name']
        read_only_fields = ['user']

    def validate(self, data):
        if 'transaction_type' not in data or data['transaction_type'] not in ['credit', 'debit']:
            raise serializers.ValidationError({'transaction_type': 'This field is required and must be either "credit" or "debit".'})
        if 'payment_type' not in data or data['payment_type'] not in ['Cash', 'Banking']:
            raise serializers.ValidationError({'payment_type': 'This field is required and must be either "Cash" or "Banking".'})
        return data

class EmployeeActionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeActionHistory
        fields = ['id', 'action', 'date', 'details']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.date:
            rep['date'] = instance.date.strftime('%d-%m-%Y')
        return rep

class OtherTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherType
        fields = ['type']


class OtherNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherName
        fields = ['id', 'type', 'name', 'created_at']

class BalanceSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = BalanceSheet
        fields = ['id', 'year', 'data', 'created_at', 'updated_at']
