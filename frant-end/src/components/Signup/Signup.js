import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import "../../styles/Signup.css";
import Footer from '../Footer';
import Toast from '../Toast';
import { signup } from '../services/authApi';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [timer]);

  const handleResendOtp = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    alert("Resend OTP (placeholder)");
  };

  const handleGetOtp = () => {
    setOtpRequested(true);
    setTimer(60);
    setCanResend(false);
    alert("OTP sent to email (placeholder)");
  };

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

    // Simple signup logic - you can customize this
    // Save user data to localStorage
    const data = { email, password, mobile, firstName };
    try {
      const result = await signup(data);
      if (result.message === 'User created successfully') {
        setShowSuccess(true); // Show Toast
      } else {
        setError(result.message || "Signup failed. Username or email might be in use.");
      }
    } catch (error) {
      setError("Network error or server issue.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        navigate("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  return (
    <>
      <section className="auth-section">
        {showSuccess && (
          <Toast
            message="Signup successful! Please login."
            type="success"
            onClose={() => {
              setShowSuccess(false);
              navigate("/login");
            }}
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
                />
                <button
                  type="button"
                  className="auth-button"
                  style={{ padding: "12px 15px",marginBottom:"20px", fontSize: "13px", marginLeft: "5px", minWidth: "50px", maxWidth: "90px", whiteSpace: "nowrap", height: "100%" }}
                  onClick={handleGetOtp}
                >
                  Get OTP
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
              <input type="tel" 
              name="mobile" 
              pattern="[0-9]{10}" 
              maxlength="10" 
              placeholder="Enter 10-digit mobile number" 
              required 
              />


              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
                <span onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                  {showPassword ? <EyeSlash /> : <Eye />}
                </span>
              </div>

              <label>Confirm Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm password"
                />
              </div>

              <button type="submit" className="auth-button">
                Signup
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
