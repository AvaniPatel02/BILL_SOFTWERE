from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

# Create your models here.

class OTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        expiry_time = self.created_at + timedelta(minutes=10)
        return timezone.now() > expiry_time

    def __str__(self):
        return f"OTP for {self.email}"

    class Meta:
        ordering = ['-created_at']

class CustomUserManager(BaseUserManager):
    def create_user(self, email, first_name, mobile, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            mobile=mobile,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, mobile, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, first_name, mobile, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'mobile']

    def __str__(self):
        return self.email

def user_profile_image_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/profile_images/user_<id>/<filename>
    return f'profile_images/user_{instance.user.id}/{filename}'

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    image1 = models.ImageField(upload_to=user_profile_image_path, blank=True, null=True)
    image2 = models.ImageField(upload_to=user_profile_image_path, blank=True, null=True)

    def __str__(self):
        return f"Profile for {self.user.email}"

    @property
    def first_name(self):
        return self.user.first_name

    @property
    def mobile(self):
        return self.user.mobile

    @property
    def email(self):
        return self.user.email
    
    

class Settings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings', null=True, blank=True)
    # Seller Info
    company_name = models.CharField(max_length=255, blank=True, null=True)
    seller_address = models.TextField(blank=True, null=True)
    seller_email = models.EmailField(blank=True, null=True)
    seller_pan = models.CharField(max_length=20, blank=True, null=True)
    seller_gstin = models.CharField(max_length=20, blank=True, null=True)
    # Company Bank Details
    bank_account_holder = models.CharField(max_length=255, blank=True, null=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=255, blank=True, null=True)
    swift_code = models.CharField(max_length=20, blank=True, null=True)
    HSN_codes = models.JSONField(default=list, blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    def __str__(self):
        return f"Settings (ID: {self.id})"


class Invoice(models.Model):
    # User
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)

    # Buyer Info (required fields)
    buyer_name = models.CharField(max_length=255)
    buyer_address = models.TextField()
    buyer_gst = models.CharField(max_length=20, blank=True, null=True)
    
    # Consignee Info (optional)
    consignee_name = models.CharField(max_length=255, blank=True, null=True)
    consignee_address = models.TextField(blank=True, null=True)
    consignee_gst = models.CharField(max_length=20, blank=True, null=True)

    # Invoice details (date is required)
    financial_year = models.CharField(max_length=9, default='2025-2026')
    invoice_number = models.CharField(max_length=20, default="01-2025/2026")
    invoice_date = models.DateField()
    
    # Optional fields
    delivery_note = models.CharField(max_length=255, blank=True, null=True, default='')
    payment_mode = models.CharField(max_length=100, blank=True, null=True, default='')
    delivery_note_date = models.DateField(null=True, blank=True)
    destination = models.CharField(max_length=255, blank=True, null=True, default='')
    terms_to_delivery = models.CharField(max_length=255, blank=True, null=True, default='')

    # Country and Currency Info
    country = models.CharField(max_length=255, default='India')
    currency = models.CharField(max_length=10, default='INR')
    currency_symbol = models.CharField(max_length=5, default='₹')
    state = models.CharField(max_length=50, default="Gujarat")

    # Product details
    particulars = models.CharField(max_length=255, blank=True, null=True, default='Consultancy')
    total_hours = models.FloatField(blank=True, null=True, default=0.0)
    rate = models.FloatField(blank=True, null=True, default=0.0)
    base_amount = models.FloatField()
    total_amount = models.FloatField()

    # Tax details
    cgst = models.FloatField(blank=True, null=True, default=0.0)
    sgst = models.FloatField(blank=True, null=True, default=0.0)
    igst = models.FloatField(blank=True, null=True, default=0.0)
    total_with_gst = models.FloatField()
    amount_in_words = models.CharField(max_length=255, blank=True, null=True)
    taxtotal = models.FloatField(blank=True, null=True, default=0.0)

    # Remarks
    remark = models.TextField(blank=True, null=True, default='')

    # Currency conversion
    exchange_rate = models.FloatField(blank=True, null=True, default=1.0)
    inr_equivalent = models.FloatField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Country flag
    country_flag = models.URLField(max_length=300, blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.buyer_name}"


class BankAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

class CashEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cash_entries')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

# Employee model for salary management
class Employee(models.Model):
    name = models.CharField(max_length=255)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    joining_date = models.DateField(null=True, blank=True)
    email = models.EmailField()
    number = models.CharField(max_length=20)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        print(f"[DEBUG] Soft-deleting employee: {self.id} - {self.name}")
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
        print(f"[DEBUG] Employee {self.id} is_deleted: {self.is_deleted}, deleted_at: {self.deleted_at}")

    def restore(self):
        print(f"[DEBUG] Restoring employee: {self.id} - {self.name}")
        self.is_deleted = False
        self.deleted_at = None
        self.save()
        print(f"[DEBUG] Employee {self.id} is_deleted: {self.is_deleted}, deleted_at: {self.deleted_at}")

    def __str__(self):
        return self.name


class Buyer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyers')
    name = models.CharField(max_length=255)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    payment_type = models.CharField(max_length=20, choices=[('Bank', 'Bank'), ('Cash', 'Cash')], default='Bank')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.amount} on {self.date}"


class CompanyBill(models.Model):
    company = models.CharField(max_length=255)
    invoice = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    notice = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    bank = models.CharField(max_length=100, blank=True, null=True)

class BuyerBill(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notice = models.TextField(blank=True, null=True)
    payment_type = models.CharField(max_length=50)
    bank = models.CharField(max_length=100, blank=True, null=True)
    manual = models.BooleanField(default=False)

class Salary(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    bank = models.CharField(max_length=100, blank=True, null=True)

class OtherTransaction(models.Model):
    type = models.CharField(max_length=100)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notice = models.TextField(blank=True, null=True)
    payment_type = models.CharField(max_length=50)
    bank = models.CharField(max_length=100, blank=True, null=True)
    transaction_type = models.CharField(max_length=10, choices=[('credit', 'Credit'), ('debit', 'Debit')])


class EmployeeActionHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='action_histories')
    action = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.employee.name} - {self.action} at {self.date}"


class OtherType(models.Model):
    type = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.type


