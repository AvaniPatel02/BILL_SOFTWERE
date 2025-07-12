import React, { useState, useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "../../services/authApi";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "../../styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ first_name: "", mobile: "", email: "" });
  const [emailStep, setEmailStep] = useState(0); 
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false); // New state for button loading

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
        console.log("Token found:", !!token); // Debug log
        
        if (!token) {
          toast.error("No authentication token found. Please login again.");
          setLoading(false);
          return;
        }

        console.log("Fetching profile from:", "http://localhost:8000/api/auth/profile/"); // Debug log
        const res = await getProfile(token);
        console.log("Profile response:", res); // Debug log
        
        if (res.success) {
          const profileData = {
            email: res.data.email,
            first_name: res.data.first_name,
            mobile: res.data.mobile
          };
          console.log("Setting profile data:", profileData); // Debug log
          setProfile(profileData);
          setForm(profileData);
        } else {
          console.error("Profile fetch failed:", res); // Debug log
          toast.error(res.message || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          toast.error("Cannot connect to server. Please check if backend is running.");
        } else {
          toast.error("Network error while fetching profile: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save name and mobile
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const res = await updateProfile(token, {
        first_name: form.first_name,
        mobile: form.mobile
      });
      
      if (res.success) {
        toast.success("Profile updated successfully!");
        setProfile({ ...profile, first_name: form.first_name, mobile: form.mobile });
        setEdit(false);
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Network error while updating profile");
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setForm({
      first_name: profile.first_name,
      mobile: profile.mobile,
      email: profile.email
    });
    setEdit(false);
  };

  // Start email change process
  const startEmailChange = async () => {
    try {
      setEmailChangeLoading(true); // Start loading
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        setEmailChangeLoading(false);
        return;
      }

      const res = await sendCurrentEmailOtp(token);
      if (res.success) {
        setEmailStep(1);
        toast.success("OTP sent to current email");
      } else {
        toast.error(res.message || "Failed to send OTP");
        setEmailChangeLoading(false);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Network error while sending OTP");
      setEmailChangeLoading(false);
    }
  };

  // Verify current email OTP
  const handleVerifyCurrentEmailOtp = async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const res = await verifyCurrentEmailOtp(token, currentEmailOtp);
      if (res.success) {
        setEmailStep(2);
        toast.success("Current email verified! Enter new email.");
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Network error while verifying OTP");
    }
  };

  // Send OTP to new email
  const handleSendNewEmailOtp = async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const res = await sendNewEmailOtp(token, newEmail);
      if (res.success) {
        setEmailStep(3);
        toast.success("OTP sent to new email");
      } else {
        toast.error(res.message || "Failed to send OTP to new email");
      }
    } catch (error) {
      console.error("Error sending OTP to new email:", error);
      toast.error("Network error while sending OTP");
    }
  };

  // Verify new email OTP
  const handleVerifyNewEmailOtp = async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const res = await verifyNewEmailOtp(token, newEmailOtp);
      if (res.success) {
        setEmailStep(4);
        toast.success("New email verified! Click update to finish.");
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying new email OTP:", error);
      toast.error("Network error while verifying OTP");
    }
  };

  // Update email in backend
  const handleUpdateEmail = async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const res = await updateEmail(token);
      if (res.success) {
        toast.success("Email updated successfully!");
        setProfile({ ...profile, email: newEmail });
        setForm({ ...form, email: newEmail });
        setEmailStep(0);
        setNewEmail("");
        setNewEmailOtp("");
        setCurrentEmailOtp("");
      } else {
        toast.error(res.message || "Failed to update email");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Network error while updating email");
    }
  };

  // Cancel email change process
  const cancelEmailChange = () => {
    setEmailStep(0);
    setNewEmail("");
    setNewEmailOtp("");
    setCurrentEmailOtp("");
    setEmailChangeLoading(false); // Reset loading on cancel
  };

  // When modal opens, stop loading
  useEffect(() => {
    if (emailStep > 0) {
      setEmailChangeLoading(false);
    }
  }, [emailStep]);

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="profile-container">
          <div className="profile-content">
            <div className="loading-section">
              <div className="loading-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="loading-text">Loading profile...</div>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Header />
        <div className="profile-container">
          <div className="profile-content">
            <div className="error-section">
              <div className="error-avatar">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="error-text">Failed to load profile</div>
              <button 
                className="retry-btn"
                onClick={() => window.location.reload()} 
              >
                <i className="fas fa-redo"></i> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="profile-container">
        <ToastContainer />
        <div className="profile-content">
          {/* Back Button */}
          <button className="back-btn" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>

          {/* Profile Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <span className="avatar-text">{getInitials(form.first_name)}</span>
            </div>
            <div className="avatar-badge">
              <i className="fas fa-crown"></i>
            </div>
          </div>

          <h2 className="profile-title">
            <i className="fas fa-user-circle"></i> Profile
          </h2>
          
          <div className="profile-form">
            <div className="form-group">
              <label>
                <i className="fas fa-user"></i> Name:
              </label>
              <div className="input-wrapper">
                <input 
                  className={`form-input ${!edit ? 'readonly' : ''}`}
                  name="first_name" 
                  value={form.first_name} 
                  onChange={handleChange} 
                  disabled={!edit} 
                />
                {edit && <i className="fas fa-edit input-icon"></i>}
              </div>
            </div>
            
            <div className="form-group">
              <label>
                <i className="fas fa-phone"></i> Mobile:
              </label>
              <div className="input-wrapper">
                <input 
                  className={`form-input ${!edit ? 'readonly' : ''}`}
                  name="mobile" 
                  value={form.mobile} 
                  onChange={handleChange} 
                  disabled={!edit} 
                />
                {edit && <i className="fas fa-edit input-icon"></i>}
              </div>
            </div>
            
            <div className="form-group">
              <label>
                <i className="fas fa-envelope"></i> Email:
              </label>
              <div className="input-wrapper">
                <input 
                  className="form-input readonly"
                  name="email" 
                  value={form.email} 
                  disabled 
                />
                <i className="fas fa-lock input-icon"></i>
              </div>
              {emailStep === 0 && (
                <button 
                  className="update-email-btn" 
                  onClick={startEmailChange}
                  disabled={emailChangeLoading}
                >
                  {emailChangeLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-key"></i> Change Email
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="button-group">
              {edit ? (
                <>
                  <button className="save-btn" onClick={handleSave}>
                    <i className="fas fa-save"></i> Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </>
              ) : (
                <button className="save-btn" onClick={() => setEdit(true)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
              )}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="profile-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>

          {/* Email change steps */}
          {emailStep > 0 && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <i className="fas fa-envelope-open"></i>
                  <h3>Change Email</h3>
                </div>
                
                {emailStep === 1 && (
                  <div>
                    <div className="form-group">
                      <label>
                        <i className="fas fa-shield-alt"></i> Enter OTP sent to current email:
                      </label>
                      <div className="otp-input-group">
                        <input
                          className="form-input"
                          value={currentEmailOtp}
                          onChange={e => setCurrentEmailOtp(e.target.value)}
                          placeholder="Enter OTP"
                        />
                        <button className="get-otp-btn" onClick={handleVerifyCurrentEmailOtp}>
                          <i className="fas fa-check"></i> Verify
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {emailStep === 2 && (
                  <div>
                    <div className="form-group">
                      <label>
                        <i className="fas fa-envelope"></i> Enter new email:
                      </label>
                      <div className="otp-input-group">
                        <input
                          className="form-input"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder="Enter new email"
                        />
                        <button className="get-otp-btn" onClick={handleSendNewEmailOtp}>
                          <i className="fas fa-paper-plane"></i> Send OTP
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {emailStep === 3 && (
                  <div>
                    <div className="form-group">
                      <label>
                        <i className="fas fa-shield-alt"></i> Enter OTP sent to new email:
                      </label>
                      <div className="otp-input-group">
                        <input 
                          className="form-input"
                          value={newEmailOtp} 
                          onChange={e => setNewEmailOtp(e.target.value)} 
                          placeholder="Enter OTP" 
                        />
                        <button className="get-otp-btn" onClick={handleVerifyNewEmailOtp}>
                          <i className="fas fa-check"></i> Verify
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {emailStep === 4 && (
                  <div>
                    <div className="success-message">
                      <i className="fas fa-check-circle"></i>
                      <p>All verifications complete! Click update to finish.</p>
                    </div>
                    <button className="submit-btn" onClick={handleUpdateEmail}>
                      <i className="fas fa-save"></i> Update Email
                    </button>
                  </div>
                )}
                
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={cancelEmailChange}>
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 