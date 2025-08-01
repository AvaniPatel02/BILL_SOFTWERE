import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Signup.css";
import Footer from './Footer';
import Toast from '../Toast';
import { sendOtp, resendOtp, verifyOtp, register } from "../../services/authApi";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingOtp, setIsGettingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (otpRequested && timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpRequested && timer <= 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [timer, otpRequested]);

  // Send OTP
  const handleGetOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    setIsGettingOtp(true);
    const res = await sendOtp({ email });
    setIsGettingOtp(false);
    if (res.success) {
      setOtpRequested(true);
      setTimer(30); // Changed from 60 to 30
      setShowSuccess(true);
    } else {
      setError(res.message || "Failed to send OTP.");
    }
  };

  // Resend OTP
  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (!canResend) return;
    setError("");
    setIsGettingOtp(true);
    const res = await resendOtp({ email });
    setIsGettingOtp(false);
    if (res.success) {
      setTimer(30); // Changed from 60 to 30
      setCanResend(false);
      setShowSuccess(true);
    } else {
      setError(res.message || "Failed to resend OTP.");
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setIsVerifyingOtp(true);
    const res = await verifyOtp({ email, otp_code: otp });
    setIsVerifyingOtp(false);
    if (res.success) {
      setOtpVerified(true);
      setShowSuccess(true);
    } else {
      setError(res.message || "OTP verification failed.");
    }
  };

  // Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    // Basic validation
    if (!email || !mobile || !firstName || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!otpVerified) {
      setError("Please verify your OTP before signing up.");
      return;
    }
    setIsSigningUp(true);
    // Register with backend
    const res = await register({
      first_name: firstName,
      email,
      mobile,
      password,
      password2: confirmPassword
    });
    setIsSigningUp(false);
    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/");
      }, 2000);
    } else {
      setError(res.message || "Signup failed.");
    }
  };

  return (
    <>
      <section className="auth-section">
        {showSuccess && (
          <Toast
            message={
              otpVerified
                ? "OTP verified! You can now sign up."
                : otpRequested
                ? "OTP sent to your email."
                : "Signup successful! Please login."
            }
            type="success"
            onClose={() => setShowSuccess(false)}
            duration={2000}
          />
        )}
        <div className="auth-container">
          <div className="auth-image">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              alt="Signup visual"
            />
          </div>
          <div className="auth-form-container">
            <form onSubmit={handleSignup} className="auth-form">
              <h2 className="auth-title">Create an Account</h2>
              {error && <div className="auth-error">{error}</div>}

              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Enter your first name"
              />

              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={otpRequested}
              />

              <label>OTP</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter OTP"
                  style={{ flex: 5, minWidth: "0" }}
                  disabled={!otpRequested || otpVerified}
                />
                <button
                  type="button"
                  className="auth-button"
                  style={{ padding: "12px 15px", marginBottom: "20px", fontSize: "13px", marginLeft: "5px", minWidth: "50px", maxWidth: "90px", whiteSpace: "nowrap", height: "100%", opacity: isGettingOtp ? 0.7 : 1, pointerEvents: isGettingOtp ? 'none' : 'auto' }}
                  onClick={handleGetOtp}
                  disabled={otpRequested || isGettingOtp}
                >
                  {isGettingOtp ? "Getting..." : "Get OTP"}
                </button>
                <button
                  type="button"
                  className={`auth-button ${otpVerified ? 'verified' : ''}`}
                  style={{ padding: "12px 15px", marginBottom: "20px", fontSize: "13px", marginLeft: "5px", minWidth: "50px", maxWidth: "90px", whiteSpace: "nowrap", height: "100%", background: otpVerified ? '#28a745' : '', color: otpVerified ? '#fff' : '', opacity: isVerifyingOtp ? 0.7 : 1, pointerEvents: isVerifyingOtp ? 'none' : 'auto' }}
                  onClick={handleVerifyOtp}
                  disabled={!otpRequested || otpVerified || isVerifyingOtp}
                >
                  {isVerifyingOtp ? "Verifying..." : otpVerified ? "Verified" : "Verify OTP"}
                </button>
              </div>
              {otpRequested && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", color: timer === 0 ? '#28a745' : '#6c757d' }}>{timer > 0 ? `Resend in 0:${timer.toString().padStart(2, '0')}` : ""}</span>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: canResend ? "#0d6efd" : "#6c757d", cursor: canResend ? "pointer" : "not-allowed", padding: 0, textDecoration: "underline", fontSize: "14px" }}
                    onClick={handleResendOtp}
                    disabled={!canResend}
                  >
                    Resend OTP
                  </button>
                </div>
              )}

              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                pattern="[0-9]{10}"
                maxLength="10"
                placeholder="Enter 10-digit mobile number"
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                autoComplete="new-password"
              />

              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                autoComplete="new-password"
              />

              <button type="submit" className="auth-button" disabled={!otpVerified || isSigningUp}
                style={{ opacity: isSigningUp ? 0.7 : 1, pointerEvents: isSigningUp ? 'none' : 'auto' }}>
                {isSigningUp ? "Signing up..." : "Signup"}
              </button>

              <div className="auth-footer-text">
                Already have an account? <Link to="/">Login</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Signup;
