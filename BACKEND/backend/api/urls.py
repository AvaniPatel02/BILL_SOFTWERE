from django.urls import path
from . import views
from .views_settings import settings_view
from .views_invoice import InvoiceCalculationView, InvoiceViewSet
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    # AUTHENTICATION APIS
    path('auth/register/', views.signup_view, name='register'),
    path('auth/verify-otp/', views.verify_otp_view, name='verify-otp'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/send-otp/', views.send_otp, name='send-otp'),
    path('auth/resend-otp/', views.resend_otp, name='resend-otp'),

    #  FORGOT-PASSWORD APIS
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
]

urlpatterns += router.urls
