from django.urls import path
from . import views
from .views import (
    signup_view, verify_otp_view, login_view, send_otp, resend_otp,
    forgot_password_send_otp, forgot_password_verify_otp, reset_password, user_profile_view,
    send_current_email_otp, verify_current_email_otp, send_new_email_otp, verify_new_email_otp, update_email_after_otp
)
from .views_settings import settings_view

urlpatterns = [
    # AUTHENTICATION APIS
    path('auth/register/', views.signup_view, name='register'),
    path('auth/verify-otp/', views.verify_otp_view, name='verify-otp'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/send-otp/', views.send_otp, name='send-otp'),
    path('auth/resend-otp/', views.resend_otp, name='resend-otp'),

    #  FORGOT-PASSWORD APIS
    path('auth/forgot-password/send-otp/', forgot_password_send_otp, name='forgot-password-send-otp'),
    path('auth/forgot-password/verify-otp/', forgot_password_verify_otp, name='forgot-password-verify-otp'),
    path('auth/forgot-password/reset/', reset_password, name='forgot-password-reset'),

    # PROFILE APIS
    path('auth/profile/', user_profile_view, name='user-profile'),
    path('auth/profile/send-current-email-otp/', send_current_email_otp, name='send-current-email-otp'),
    path('auth/profile/verify-current-email-otp/', verify_current_email_otp, name='verify-current-email-otp'),
    path('auth/profile/send-new-email-otp/', send_new_email_otp, name='send-new-email-otp'),
    path('auth/profile/verify-new-email-otp/', verify_new_email_otp, name='verify-new-email-otp'),
    path('auth/profile/update-email/', update_email_after_otp, name='update-email-after-otp'),

    # SETTINGS API
    path('auth/settings/', settings_view, name='settings'),
]
