import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "../../styles/Login.css";
import Footer from "./Footer";
import { login } from "../../services/authApi";
import {
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword
} from "../../services/authApi"; // adjust the path as needed
import { ToastContainer, toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();

  // Common
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "forgot"
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpShowPassword, setFpShowPassword] = useState(false);
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpOtpVerified, setFpOtpVerified] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(""); // clear previous error
    setLoading(true); // Start loading
    try {
      // Use the login() function from authApi.js
      const data = await login({ email, password });
      console.log(data); // See what you get

      if (data.success && data.data && data.data.tokens && data.data.tokens.access) {
        localStorage.setItem("access_token", data.data.tokens.access); // Store access token
        if (data.data.tokens.refresh) {
          localStorage.setItem("refresh_token", data.data.tokens.refresh); // Store refresh token if present
        }
        // Redirect to dashboard or show success
        navigate("/dashboard");
      } else {
        setLoginError(data.message || "Invalid email or password");
      }
    } catch (error) {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Handle password reset
  const handlePasswordReset = (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);

    const storedUser = JSON.parse(localStorage.getItem("signupUser"));
    if (!storedUser || storedUser.email !== resetEmail) {
      setResetError("Email not found!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    // Save new password in localStorage
    const updatedUser = { ...storedUser, password: newPassword };
    localStorage.setItem("signupUser", JSON.stringify(updatedUser));
    setResetSuccess(true);

    // After reset, go back to login mode
    setTimeout(() => {
      setMode("login");
      setResetEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setResetSuccess(false);
    }, 2000);
  };

  const handleSendOTP = async () => {
    if (!fpEmail) {
      toast.error("Please enter your email first");
      return;
    }
    if (!fpEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    setFpLoading(true);
    try {
      const res = await forgotPasswordSendOtp({ email: fpEmail });
      if (res.success) {
        setFpOtpSent(true);
        toast.success("Password reset OTP sent successfully to your email!");
      } else {
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Send OTP error:", err);
    } finally {
      setFpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!fpOtp || fpOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setFpLoading(true);
    try {
      const res = await forgotPasswordVerifyOtp({ email: fpEmail, otp_code: fpOtp });
      if (res.success) {
        setFpOtpVerified(true);
        toast.success("OTP verified successfully! You can now reset your password.");
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Verify OTP error:", err);
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!fpOtpVerified) {
      toast.error("Please verify your email with OTP first");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (fpNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setFpLoading(true);
    try {
      const res = await resetPassword({
        email: fpEmail,
        otp_code: fpOtp,
        new_password: fpNewPassword,
        confirm_password: fpConfirmPassword
      });
      if (res.success) {
        toast.success("Password reset successfully! You can now login with your new password.");
        setMode("login");
        // Optionally reset forgot password state here
        setFpEmail(""); setFpOtp(""); setFpNewPassword(""); setFpConfirmPassword("");
        setFpOtpSent(false); setFpOtpVerified(false);
      } else {
        toast.error(res.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="login visual"
          />
        </div>

        <div className="auth-form-container">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="auth-form">
              <h2 className="auth-title">Login to Your Account</h2>

              {loginError && <div className="auth-error">{loginError}</div>}

              <label>Email address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter a valid email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash /> : <Eye />}
                </span>
              </div>

              <div className="auth-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <span
                  className="forgot-link"
                  onClick={() => setMode("forgot")}
                  style={{ cursor: "pointer", color: "#007bff" }}
                >
                  Forgot password?
                </span>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="auth-footer-text">
                Don't have an account? <Link to="/signup">Signup</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <h2 className="auth-title">Forgot Password</h2>
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                Enter your email to receive a password reset OTP
              </p>

              <label>Email</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                <input
                  type="email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  style={{ flex: 1 }}
                  disabled={fpOtpSent}
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={fpLoading || fpOtpSent}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: fpOtpSent ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: fpOtpSent ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {fpLoading ? "Sending..." : fpOtpSent ? "OTP Sent" : "Get OTP"}
                </button>
              </div>

              {fpOtpSent && (
                <>
                  <label>OTP</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                    <input
                      type="text"
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{ flex: 1 }}
                      disabled={fpOtpVerified}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={fpLoading || fpOtpVerified || fpOtp.length !== 6}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: fpOtpVerified ? '#28a745' : (fpOtp.length !== 6 ? '#ccc' : '#007bff'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (fpOtpVerified || fpOtp.length !== 6) ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {fpLoading ? "Verifying..." : fpOtpVerified ? "✓ Verified" : "Verify OTP"}
                    </button>
                  </div>
                  {fpOtpVerified && (
                    <div style={{ color: '#28a745', fontSize: '14px', marginTop: '5px' }}>
                      ✓ OTP verified successfully!
                    </div>
                  )}
                </>
              )}

              {fpOtpVerified && (
                <>
                  <label>New Password</label>
                  <div className="password-field">
                    <input
                      type={fpShowPassword ? "text" : "password"}
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      required
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <span onClick={() => setFpShowPassword(!fpShowPassword)} className="toggle-password">
                      {fpShowPassword ? <EyeSlash /> : <Eye />}
                    </span>
                  </div>

                  <label>Confirm New Password</label>
                  <div className="password-field">
                    <input
                      type={fpShowPassword ? "text" : "password"}
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="auth-button"
                disabled={fpLoading || !fpOtpVerified}
                style={{
                  backgroundColor: !fpOtpVerified ? '#ccc' : undefined,
                  cursor: !fpOtpVerified ? 'not-allowed' : undefined
                }}
              >
                {fpLoading ? "Resetting Password..." : "Reset Password"}
              </button>

              <div className="auth-footer-text">
                Remember your password?{" "}
                <span
                  style={{ color: "#007bff", cursor: "pointer" }}
                  onClick={() => setMode("login")}
                >
                  Back to Login
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </section>
  );
};

export default Login;
