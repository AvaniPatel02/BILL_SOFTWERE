from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, OTPSerializer, LoginResponseSerializer
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import OTP
import random, string
from django.core.mail import send_mail
from django.conf import settings
from .models import Profile
from .serializers import ProfileSerializer
from django.urls import path
from .models import Settings
from .serializers import SettingsSerializer
from .models import OtherType
from .serializers import OtherTypeSerializer
from .models import Invoice, Buyer
from .serializers import InvoiceSerializer, BuyerSerializer


User = get_user_model()

# AUTHENTICATION FUNCTIONS

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            otp = OTP.objects.filter(email=email).latest('created_at')
            if not otp.is_verified:
                return Response({"success": False, "message": "Please verify your OTP first."}, status=status.HTTP_400_BAD_REQUEST)
        except OTP.DoesNotExist:
            return Response({"success": False, "message": "Please send and verify OTP first."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"success": False, "message": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        Profile.objects.create(user=user)
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'mobile': user.mobile,
            'hashed_password': user.password,
        }
        return Response({"success": True, "message": "User created successfully.", "data": user_data}, status=status.HTTP_201_CREATED)
    return Response({"success": False, "message": "Validation error.", "data": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    if not email or not otp_code:
        return Response({"success": False, "message": "Email and OTP code are required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        otp = OTP.objects.filter(email=email).latest('created_at')
    except OTP.DoesNotExist:
        return Response({"success": False, "message": "OTP not found. Please send OTP first."}, status=status.HTTP_404_NOT_FOUND)
    if otp.is_expired():
        otp.delete()
        return Response({"success": False, "message": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
    if otp.is_verified:
        return Response({"success": False, "message": "OTP has already been used."}, status=status.HTTP_400_BAD_REQUEST)
    if otp.otp_code == otp_code:
        otp.is_verified = True
        otp.save()
        return Response({"success": True, "message": "OTP verified successfully. You can now proceed with registration."}, status=status.HTTP_200_OK)
    else:
        return Response({"success": False, "message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({"success": False, "message": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=email, password=password)
    if user:
        serializer = LoginResponseSerializer(user)
        return Response({"success": True, "message": "Login successful.", "data": serializer.data}, status=status.HTTP_200_OK)
    else:
        return Response({"success": False, "message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({"success": False, "message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"success": False, "message": "User already exists. Please login directly."}, status=status.HTTP_400_BAD_REQUEST)
    otp_code = ''.join(random.choices(string.digits, k=6))
    OTP.objects.filter(email=email).delete()
    OTP.objects.create(email=email, otp_code=otp_code)
    subject = 'Email Verification OTP'
    message = f"""
Welcome to Invoice Management!

Thank you for signing up. To complete your registration, please verify your email address using the One-Time Password (OTP) below:

🔐 Your OTP is: {otp_code}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you did not create an account with us, you can safely ignore this email.

Best regards,
The Invoice Management Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    return Response({"success": True, "message": "OTP sent successfully to your email.", "data": {"email": email}}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({"success": False, "message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"success": False, "message": "User already exists. Please login directly."}, status=status.HTTP_400_BAD_REQUEST)
    otp_code = ''.join(random.choices(string.digits, k=6))
    OTP.objects.filter(email=email).delete()
    OTP.objects.create(email=email, otp_code=otp_code)
    subject = 'Your Resent OTP Code'
    message = f"""
Welcome to Invoice Management!

Here is your new One-Time Password (OTP) to complete your registration:

🔐 Your new OTP is: {otp_code}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you did not create an account with us, you can safely ignore this email.

Best regards,
The Invoice Management Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    return Response({"success": True, "message": "OTP resent successfully to your email.", "data": {"email": email}}, status=status.HTTP_200_OK)

# FORGOT PASSWORD FUNCTIONS 

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({"success": False, "message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not User.objects.filter(email=email).exists():
        return Response({"success": False, "message": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)
    otp_code = ''.join(random.choices(string.digits, k=6))
    OTP.objects.filter(email=email).delete()
    OTP.objects.create(email=email, otp_code=otp_code)
    subject = 'Password Reset OTP'
    message = f'Your password reset OTP is: {otp_code}\nThis OTP will expire in 10 minutes.'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    return Response({"success": True, "message": "Password reset OTP sent to your email.", "data": {"email": email}}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_verify_otp(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    try:
        otp = OTP.objects.filter(email=email).latest('created_at')
    except OTP.DoesNotExist:
        return Response({"success": False, "message": "OTP not found."}, status=status.HTTP_404_NOT_FOUND)
    if otp.is_expired():
        otp.delete()
        return Response({"success": False, "message": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
    if otp.is_verified:
        return Response({"success": False, "message": "OTP has already been used."}, status=status.HTTP_400_BAD_REQUEST)
    if otp.otp_code == otp_code:
        otp.is_verified = True
        otp.save()
        return Response({"success": True, "message": "OTP verified."}, status=status.HTTP_200_OK)
    else:
        return Response({"success": False, "message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    if not all([email, otp_code, new_password, confirm_password]):
        return Response({"success": False, "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)
    if new_password != confirm_password:
        return Response({"success": False, "message": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        otp = OTP.objects.filter(email=email).latest('created_at')
    except OTP.DoesNotExist:
        return Response({"success": False, "message": "OTP not found."}, status=status.HTTP_404_NOT_FOUND)
    if not otp.is_verified or otp.otp_code != otp_code:
        return Response({"success": False, "message": "OTP not verified or invalid."}, status=status.HTTP_400_BAD_REQUEST)
    if otp.is_expired():
        otp.delete()
        return Response({"success": False, "message": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        otp.delete()
        return Response({"success": True, "message": "Password reset successful."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

# PROFILE FUNCTIONS

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    profile, created = Profile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response({"success": True, "message": "Profile fetched successfully.", "data": serializer.data})
    elif request.method == 'PUT':
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Profile updated successfully.", "data": serializer.data})
        return Response({"success": False, "message": "Profile update failed.", "data": serializer.errors}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_current_email_otp(request):
    user = request.user
    otp_code = ''.join(random.choices(string.digits, k=6))
    OTP.objects.filter(email=user.email).delete()
    OTP.objects.create(email=user.email, otp_code=otp_code)
    send_mail(
        'OTP for Email Change',
        f'Your OTP is: {otp_code}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False
    )
    return Response({"success": True, "message": "OTP sent to current email."})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_current_email_otp(request):
    user = request.user
    otp_code = request.data.get('otp_code')
    try:
        otp = OTP.objects.filter(email=user.email).latest('created_at')
    except OTP.DoesNotExist:
        return Response({"success": False, "message": "OTP not found."}, status=404)
    if otp.otp_code == otp_code and not otp.is_expired():
        otp.is_verified = True
        otp.save()
        # Return a flag to the frontend
        return Response({"success": True, "message": "Current email OTP verified.", "current_email_otp_verified": True})
    return Response({"success": False, "message": "Invalid or expired OTP."}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_new_email_otp(request):
    # Require the flag in the request
    current_email_otp_verified = request.data.get('current_email_otp_verified')
    if not current_email_otp_verified:
        return Response({"success": False, "message": "Current email OTP not verified."}, status=400)
    new_email = request.data.get('new_email')
    if not new_email:
        return Response({"success": False, "message": "New email required."}, status=400)
    if User.objects.filter(email=new_email).exists():
        return Response({"success": False, "message": "This email is already registered. Please use a different email."}, status=400)
    otp_code = ''.join(random.choices(string.digits, k=6))
    OTP.objects.filter(email=new_email).delete()
    OTP.objects.create(email=new_email, otp_code=otp_code)
    send_mail(
        'OTP for New Email',
        f'Your OTP is: {otp_code}',
        settings.DEFAULT_FROM_EMAIL,
        [new_email],
        fail_silently=False
    )
    # Return the new email to the frontend for tracking
    return Response({"success": True, "message": "OTP sent to new email.", "pending_new_email": new_email})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_new_email_otp(request):
    user = request.user
    new_email = request.data.get('new_email')
    otp_code = request.data.get('otp_code')
    if not new_email:
        return Response({"success": False, "message": "No new email pending verification."}, status=400)
    try:
        otp = OTP.objects.filter(email=new_email).latest('created_at')
    except OTP.DoesNotExist:
        return Response({"success": False, "message": "OTP not found."}, status=404)
    if otp.otp_code == otp_code and not otp.is_expired():
        otp.is_verified = True
        otp.save()
        # Update the user's email immediately
        user.email = new_email
        user.save()
        if hasattr(user, 'profile'):
            user.profile.save()
        return Response({"success": True, "message": "New email OTP verified and email updated.", "new_email_otp_verified": True, "pending_new_email": new_email})
    return Response({"success": False, "message": "Invalid or expired OTP."}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_email_after_otp(request):
    user = request.user
    # Require both verifications and the new email in the request
    current_email_otp_verified = request.data.get('current_email_otp_verified')
    new_email_otp_verified = request.data.get('new_email_otp_verified')
    new_email = request.data.get('new_email')
    if not (current_email_otp_verified and new_email_otp_verified):
        return Response({"success": False, "message": "Both OTPs must be verified."}, status=400)
    if not new_email:
        return Response({"success": False, "message": "No new email to update."}, status=400)
    user.email = new_email
    user.save()
    if hasattr(user, 'profile'):
        user.profile.save()
    return Response({"success": True, "message": "Email updated successfully."})