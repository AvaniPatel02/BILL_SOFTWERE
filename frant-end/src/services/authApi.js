import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function refreshToken() {
  const res = await fetch(`${API_BASE_URL}/login/refresh/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function authFetch(url, options = {}) {
  const headers = getAuthHeaders();
  const opts = { ...options, headers: { ...headers, ...(options.headers || {}) }, credentials: 'include' };
  let res = await fetch(url, opts);
  if (res.status === 401 && localStorage.getItem('refresh_token')) {
    // try refresh logic here if needed
  }
  return res;
}

export async function sendOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function verifyOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function register(data) {
  const res = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function login(data) {
  const res = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function forgotPasswordSendOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function forgotPasswordVerifyOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function resetPassword(data) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password/reset/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function updateProfile(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sendCurrentEmailOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/send-current-email-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function verifyCurrentEmailOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/verify-current-email-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sendNewEmailOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/send-new-email-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function verifyNewEmailOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/verify-new-email-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateEmailAfterOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/update-email/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function resendOtp(data) {
  const res = await fetch(`${API_BASE_URL}/auth/resend-otp/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
} 