from django.urls import path
from . import views
from . import views_bank_cash
from .views_settings import settings_view
from .views_invoice import InvoiceCalculationView, InvoiceViewSet, get_next_invoice_number
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter
from .views_bank_cash import (
    bank_accounts_list_create, bank_account_detail, bank_accounts_deleted, bank_account_restore,
    cash_entries_list_create, cash_entry_detail, cash_entries_deleted, cash_entry_restore,
    bank_account_permanent_delete, cash_entry_permanent_delete
)
from .views_employee import EmployeeListCreateView, EmployeeRetrieveUpdateDestroyView, deleted_employees, restore_employee

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    # AUTHENTICATION APIS
    path('auth/register/', views.signup_view, name='register'),
    path('auth/verify-otp/', views.verify_otp_view, name='verify-otp'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/send-otp/', views.send_otp, name='send-otp'),
    path('auth/resend-otp/', views.resend_otp, name='resend-otp'),

    # FORGOT-PASSWORD APIS
    path('auth/forgot-password/send-otp/', views.forgot_password_send_otp, name='forgot-password-send-otp'),
    path('auth/forgot-password/verify-otp/', views.forgot_password_verify_otp, name='forgot-password-verify-otp'),
    path('auth/forgot-password/reset/', views.reset_password, name='forgot-password-reset'),

    # PROFILE APIS
    path('auth/profile/', views.user_profile_view, name='user-profile'),
    path('auth/profile/send-current-email-otp/', views.send_current_email_otp, name='send-current-email-otp'),
    path('auth/profile/verify-current-email-otp/', views.verify_current_email_otp, name='verify-current-email-otp'),
    path('auth/profile/send-new-email-otp/', views.send_new_email_otp, name='send-new-email-otp'),
    path('auth/profile/verify-new-email-otp/', views.verify_new_email_otp, name='verify-new-email-otp'),
    path('auth/profile/update-email/', views.update_email_after_otp, name='update-email-after-otp'),

    # SETTINGS API
    path('auth/settings/', settings_view, name='settings'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # INVOICE CALCULATION API
    path('calculate_invoice/', InvoiceCalculationView.as_view(), name='calculate-invoice'),
    path('get_next_invoice_number/', get_next_invoice_number, name='get_next_invoice_number'),

    # BANKING AND CASH API
    path('bank-accounts/', bank_accounts_list_create, name='bank-accounts-list-create'),
    path('bank-accounts/<int:pk>/', bank_account_detail, name='bank-account-detail'),
    path('bank-accounts/deleted/', bank_accounts_deleted, name='bank-accounts-deleted'),
    path('bank-accounts/<int:pk>/restore/', bank_account_restore, name='bank-account-restore'),
    path('bank-accounts/<int:pk>/permanent-delete/', bank_account_permanent_delete, name='bank-account-permanent-delete'),

    path('cash-entries/', cash_entries_list_create, name='cash-entries-list-create'),
    path('cash-entries/<int:pk>/', cash_entry_detail, name='cash-entry-detail'),
    path('cash-entries/deleted/', cash_entries_deleted, name='cash-entries-deleted'),
    path('cash-entries/<int:pk>/restore/', cash_entry_restore, name='cash-entry-restore'),
    path('cash-entries/<int:pk>/permanent-delete/', cash_entry_permanent_delete, name='cash-entry-permanent-delete'),

    # EMPLOYEE (SALARY) API
    path('banking/employee/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeRetrieveUpdateDestroyView.as_view(), name='employee-detail'),
    path('banking/employee/deleted/', deleted_employees, name='employee-deleted'),
    path('banking/employee/<int:pk>/restore/', restore_employee, name='employee-restore'),
]

urlpatterns += router.urls


