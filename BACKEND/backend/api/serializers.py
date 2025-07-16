from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OTP
from .models import Profile
from .models import Settings
from .models import BankAccount, CashEntry

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
    class Meta:
        model = CashEntry
        fields = ['id', 'amount', 'date', 'description']

# Employee serializer for salary management
from .models import Employee
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
