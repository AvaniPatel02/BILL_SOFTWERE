import BASE_URL from "./apiConfig";

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(`${BASE_URL}/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  return res.json(); // { access: "newAccessToken" }
}

export async function authFetch(url, options = {}) {
  let accessToken = localStorage.getItem("access_token");
  let refreshToken = localStorage.getItem("refresh_token");

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  let res = await fetch(url, options);

  if (res.status === 401 && refreshToken) {
    // Try to refresh the token
    try {
      const data = await refreshAccessToken(refreshToken);
      localStorage.setItem("access_token", data.access);
      // Retry the original request with new token
      options.headers.Authorization = `Bearer ${data.access}`;
      res = await fetch(url, options);
    } catch (err) {
      // Refresh failed, force logout
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  return res;
}

// Signup: Step 1 - Send OTP
export const sendSignupOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

// Signup: Step 2 - Verify OTP
export const verifySignupOtp = async (email, otp_code) => {
  const res = await fetch(`${BASE_URL}/auth/verify-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
  return res.json();
};

// Signup: Step 3 - Register
export const register = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Login
export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Forgot Password: Send OTP
export const forgotPasswordSendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

// Forgot Password: Verify OTP
export const forgotPasswordVerifyOtp = async (email, otp_code) => {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/verify-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
  return res.json();
};

// Forgot Password: Reset
export const resetPassword = async (email, otp_code, new_password, confirm_password) => {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code, new_password, confirm_password }),
  });
  return res.json();
};

// Get profile
export const getProfile = async (token) => {
  const res = await fetch(`${BASE_URL}/auth/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// Update profile (name, mobile)
export const updateProfile = async (token, data) => {
  const res = await fetch(`${BASE_URL}/auth/profile/`, {
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
  const res = await fetch(`${BASE_URL}/auth/profile/send-current-email-otp/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return res.json();
};

export const verifyCurrentEmailOtp = async (token, otp_code) => {
  const res = await fetch(`${BASE_URL}/auth/profile/verify-current-email-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_code }),
    credentials: "include",
  });
  return res.json();
};

export const sendNewEmailOtp = async (token, new_email, current_email_otp_verified) => {
  const res = await fetch(`${BASE_URL}/auth/profile/send-new-email-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_email, current_email_otp_verified }),
    credentials: "include",
  });
  return res.json();
};

export const verifyNewEmailOtp = async (token, new_email, otp_code) => {
  const res = await fetch(`${BASE_URL}/auth/profile/verify-new-email-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_email, otp_code }),
    credentials: "include",
  });
  return res.json();
};

export const updateEmail = async (token, new_email, current_email_otp_verified, new_email_otp_verified) => {
  const res = await fetch(`${BASE_URL}/auth/profile/update-email/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ new_email, current_email_otp_verified, new_email_otp_verified }),
    credentials: "include",
  });
  return res.json();
};

export const resendSignupOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/resend-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}; 