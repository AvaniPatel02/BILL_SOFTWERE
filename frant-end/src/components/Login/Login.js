import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "../../styles/Login.css";
import Footer from "../Footer";

const Login = () => {
  const navigate = useNavigate();

  // Common
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "forgot"

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

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");
    const userData = JSON.parse(localStorage.getItem("signupUser"));

    if (userData && email === userData.email && password === userData.password) {
      navigate("/dashboard");
    } else {
      setLoginError("Invalid email or password");
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

              <button type="submit" className="auth-button">Login</button>

              <p className="auth-footer-text">
                Don't have an account? <Link to="/signup">Signup</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="auth-form">
              <h2 className="auth-title">Reset Your Password</h2>
              <p style={{ textAlign: "center", color: "#666" }}>
                Enter your email and set a new password
              </p>

              {resetError && <div className="auth-error">{resetError}</div>}
              {resetSuccess && (
                <div style={{ color: "green", marginBottom: "10px" }}>
                  Password reset successful! Redirecting to login...
                </div>
              )}

              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />

              <label>New Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash /> : <Eye />}
                </span>
              </div>

              <label>Confirm New Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="auth-footer-text">
                Remembered password?{" "}
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
    </section>
  );
};

export default Login;
