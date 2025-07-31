from django.contrib import admin
from .models import (
    CustomUser, Profile, Settings, Invoice, ArchivedInvoice, 
    BankAccount, CashEntry, Employee, Buyer, CompanyBill, 
    Salary, OtherTransaction, EmployeeActionHistory, BalanceSheet, OTP
)

# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'mobile', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name']
    list_filter = ['is_active', 'is_staff', 'is_superuser']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'first_name', 'mobile', 'email']
    search_fields = ['user__email', 'user__first_name']

@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'seller_email']
    search_fields = ['company_name', 'seller_email']

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'buyer_name', 'invoice_date', 'total_with_gst', 'user']
    list_filter = ['invoice_date', 'financial_year']
    search_fields = ['buyer_name', 'invoice_number']

@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'amount', 'payment_type', 'bank', 'user', 'manual']
    list_filter = ['payment_type', 'date', 'manual']
    search_fields = ['name', 'notes']
    date_hierarchy = 'date'

@admin.register(CompanyBill)
class CompanyBillAdmin(admin.ModelAdmin):
    list_display = ['company', 'date', 'amount', 'payment_type', 'bank']
    list_filter = ['payment_type', 'date']
    search_fields = ['company', 'invoice']

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'amount', 'payment_type', 'bank']
    list_filter = ['payment_type', 'date']
    search_fields = ['name']

@admin.register(OtherTransaction)
class OtherTransactionAdmin(admin.ModelAdmin):
    list_display = ['type', 'name', 'date', 'amount', 'transaction_type', 'payment_type', 'user']
    list_filter = ['transaction_type', 'payment_type', 'date']
    search_fields = ['type', 'name', 'notice']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['name', 'salary', 'joining_date', 'email', 'number', 'is_deleted']
    list_filter = ['joining_date', 'is_deleted']
    search_fields = ['name', 'email']

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ['bank_name', 'account_number', 'amount', 'user', 'is_opening_balance']
    list_filter = ['is_opening_balance', 'is_deleted']

@admin.register(CashEntry)
class CashEntryAdmin(admin.ModelAdmin):
    list_display = ['amount', 'date', 'description', 'user', 'is_opening_balance']
    list_filter = ['date', 'is_opening_balance', 'is_deleted']

@admin.register(BalanceSheet)
class BalanceSheetAdmin(admin.ModelAdmin):
    list_display = ['year', 'created_at', 'updated_at']
    list_filter = ['year']

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['email', 'otp_code', 'created_at', 'is_verified']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['email']
