import React, { useState, useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "../../services/authApi";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import ModalPortal from "./ModalPortal";
import "../../styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ first_name: "", mobile: "", email: "" });

  // Email change modals and OTP states
  const [showCurrentEmailModal, setShowCurrentEmailModal] = useState(false);
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [currentEmailOtpSent, setCurrentEmailOtpSent] = useState(false);
  const [currentEmailOtpLoading, setCurrentEmailOtpLoading] = useState(false);
  const [currentEmailOtpError, setCurrentEmailOtpError] = useState("");
  const [currentEmailOtpVerified, setCurrentEmailOtpVerified] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");
  const [newEmailOtpSent, setNewEmailOtpSent] = useState(false);
  const [newEmailOtpLoading, setNewEmailOtpLoading] = useState(false);
  const [newEmailOtpError, setNewEmailOtpError] = useState("");
  const [newEmailOtpVerified, setNewEmailOtpVerified] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("No authentication token found. Please login again.");
          setLoading(false);
          return;
        }
        const res = await getProfile(token);
        if (res.success) {
          const profileData = {
            email: res.data.email,
            first_name: res.data.first_name,
            mobile: res.data.mobile
          };
          setProfile(profileData);
          setForm(profileData);
        } else {
          toast.error(res.message || "Failed to fetch profile");
        }
      } catch (error) {
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
      const token = localStorage.getItem("accessToken");
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

  // Handler to open current email modal and send OTP
  const handleOpenChangeEmail = async () => {
    setShowCurrentEmailModal(true);
    setCurrentEmailOtp("");
    setCurrentEmailOtpSent(false);
    setCurrentEmailOtpError("");
    setCurrentEmailOtpVerified(false);
    setCurrentEmailOtpLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await sendCurrentEmailOtp(token);
      if (res.success) {
        setCurrentEmailOtpSent(true);
        toast.success("OTP sent to your current email");
      } else {
        setCurrentEmailOtpError(res.message || "Failed to send OTP");
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      setCurrentEmailOtpError("Network error");
      toast.error("Network error");
    } finally {
      setCurrentEmailOtpLoading(false);
    }
  };

  // Handler to verify current email OTP
  const handleVerifyCurrentEmailOtp = async () => {
    setCurrentEmailOtpLoading(true);
    setCurrentEmailOtpError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await verifyCurrentEmailOtp(token, currentEmailOtp);
      if (res.success) {
        setCurrentEmailOtpVerified(true);
        setShowCurrentEmailModal(false);
        setShowNewEmailModal(true);
        setNewEmail("");
        setNewEmailOtp("");
        setNewEmailOtpSent(false);
        setNewEmailOtpError("");
        setNewEmailOtpVerified(false);
        toast.success("OTP verified. Enter new email.");
      } else {
        setCurrentEmailOtpError(res.message || "Invalid OTP");
        toast.error(res.message || "Invalid OTP");
      }
    } catch (err) {
      setCurrentEmailOtpError("Network error");
      toast.error("Network error");
    } finally {
      setCurrentEmailOtpLoading(false);
    }
  };

  // Handler to send OTP to new email
  const handleSendNewEmailOtp = async () => {
    setNewEmailOtpLoading(true);
    setNewEmailOtpError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await sendNewEmailOtp(token, newEmail, currentEmailOtpVerified);
      if (res.success) {
        setNewEmailOtpSent(true);
        toast.success("OTP sent to new email");
      } else {
        setNewEmailOtpError(res.message || "Failed to send OTP");
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      setNewEmailOtpError("Network error");
      toast.error("Network error");
    } finally {
      setNewEmailOtpLoading(false);
    }
  };

  // Handler to verify new email OTP and update email
  const handleVerifyNewEmailOtp = async () => {
    setNewEmailOtpLoading(true);
    setNewEmailOtpError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await verifyNewEmailOtp(token, newEmail, newEmailOtp);
      if (res.success) {
        setNewEmailOtpVerified(true);
        setShowNewEmailModal(false);
        setProfile({ ...profile, email: newEmail });
        setForm({ ...form, email: newEmail });
        toast.success("Email changed successfully!");
      } else {
        setNewEmailOtpError(res.message || "Invalid OTP");
        toast.error(res.message || "Invalid OTP");
      }
    } catch (err) {
      setNewEmailOtpError("Network error");
      toast.error("Network error");
    } finally {
      setNewEmailOtpLoading(false);
    }
  };

  // Handler to close modals
  const handleCloseCurrentEmailModal = () => {
    setShowCurrentEmailModal(false);
  };
  const handleCloseNewEmailModal = () => {
    setShowNewEmailModal(false);
  };

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
              <button className="update-email-btn" onClick={handleOpenChangeEmail} type="button">
                <i className="fas fa-exchange-alt"></i> Change Email
              </button>
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
        </div>
      </div>
      {/* Current Email OTP Modal */}
      {showCurrentEmailModal && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <i className="fas fa-envelope"></i>
                <h3>Verify Current Email</h3>
              </div>
              <div className="form-group">
                <label>Current Email</label>
                <input className="form-input readonly" value={profile.email} disabled />
              </div>
              <div className="form-group">
                <label>Enter OTP</label>
                <input className="form-input" value={currentEmailOtp} onChange={e => setCurrentEmailOtp(e.target.value)} maxLength={6} />
              </div>
              {currentEmailOtpError && <div className="error-text">{currentEmailOtpError}</div>}
              <div className="modal-buttons">
                <button className="modal-btn cancel-btn" onClick={handleCloseCurrentEmailModal} disabled={currentEmailOtpLoading}>Cancel</button>
                <button className="modal-btn submit-btn" onClick={handleVerifyCurrentEmailOtp} disabled={currentEmailOtpLoading || !currentEmailOtp}>Submit</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      {/* New Email OTP Modal */}
      {showNewEmailModal && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <i className="fas fa-envelope-open"></i>
                <h3>Enter New Email</h3>
              </div>
              <div className="form-group">
                <label>New Email</label>
                <input className="form-input" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
              </div>
              <div className="form-group otp-input-group">
                <input className="form-input" value={newEmailOtp} onChange={e => setNewEmailOtp(e.target.value)} maxLength={6} placeholder="Enter OTP" />
                <button className="get-otp-btn" onClick={handleSendNewEmailOtp} disabled={newEmailOtpLoading || !newEmail} type="button">
                  {newEmailOtpLoading ? "Sending..." : "Get OTP"}
                </button>
              </div>
              {newEmailOtpError && <div className="error-text">{newEmailOtpError}</div>}
              <div className="modal-buttons">
                <button className="modal-btn cancel-btn" onClick={handleCloseNewEmailModal} disabled={newEmailOtpLoading}>Cancel</button>
                <button className="modal-btn submit-btn" onClick={handleVerifyNewEmailOtp} disabled={newEmailOtpLoading || !newEmail || !newEmailOtp}>Submit</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Profile;