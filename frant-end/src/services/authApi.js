const API_BASE = "http://localhost:8000/api/auth"; // Adjust if your backend runs elsewhere

// Signup: Step 1 - Send OTP
export const sendSignupOtp = async (email) => {
  const res = await fetch(`${API_BASE}/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

// Signup: Step 2 - Verify OTP
export const verifySignupOtp = async (email, otp_code) => {
  const res = await fetch(`${API_BASE}/verify-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
  return res.json();
};

// Signup: Step 3 - Register
export const register = async (data) => {
  const res = await fetch(`${API_BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Login
export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Forgot Password: Send OTP
export const forgotPasswordSendOtp = async (email) => {
  const res = await fetch(`${API_BASE}/forgot-password/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

// Forgot Password: Verify OTP
export const forgotPasswordVerifyOtp = async (email, otp_code) => {
  const res = await fetch(`${API_BASE}/forgot-password/verify-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
  return res.json();
};

// Forgot Password: Reset
export const resetPassword = async (email, otp_code, new_password, confirm_password) => {
  const res = await fetch(`${API_BASE}/forgot-password/reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code, new_password, confirm_password }),
  });
  return res.json();
};

// Get profile
export const getProfile = async (token) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// Update profile (name, mobile)
export const updateProfile = async (token, data) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Email change steps
export const sendCurrentEmailOtp = async (token) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/send-current-email-otp/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include", // <-- add this line
  });
  return res.json();
};

export const verifyCurrentEmailOtp = async (token, otp_code) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/verify-current-email-otp/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_code }),
    credentials: "include", // <-- add this line
  });
  return res.json();
};

export const sendNewEmailOtp = async (token, new_email) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/send-new-email-otp/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_email }),
    credentials: "include", // <-- already present, keep it
  });
  return res.json();
};

export const verifyNewEmailOtp = async (token, otp_code) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/verify-new-email-otp/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_code }),
    credentials: "include", // <-- add this line
  });
  return res.json();
};

export const updateEmail = async (token) => {
  const res = await fetch("http://localhost:8000/api/auth/profile/update-email/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include", // <-- add this line
  });
  return res.json();
};

export const resendSignupOtp = async (email) => {
  const res = await fetch(`${API_BASE}/resend-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}; 