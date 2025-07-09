import React, { useState } from "react";
import Header from "./Header";
import Toast from "./Toast";
import "../styles/Profile.css";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    email: "user@example.com",
    firstName: "John",
    mobileNumber: "+91 9876543210"
  });

  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newOtpSent, setNewOtpSent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleUpdateEmail = () => {
    setShowUpdateEmailModal(true);
  };

  const handleGetOtp = () => {
    // Here you would typically send OTP to current email
    console.log("OTP sent to current email:", profileData.email);
    setOtpSent(true);
    showToast("OTP sent to your current email!", "success");
  };

  const handleGetNewOtp = () => {
    // Here you would typically send OTP to new email
    console.log("OTP sent to new email:", newEmail);
    setNewOtpSent(true);
    showToast("OTP sent to your new email!", "success");
  };

  const handleOldEmailSubmit = () => {
    // Here you would typically verify OTP for old email
    console.log("OTP verified for old email:", otp);
    setShowUpdateEmailModal(false);
    setShowNewEmailModal(true);
    setOtpSent(false);
    setOtp("");
  };

  const handleNewEmailSubmit = () => {
    // Here you would typically verify new email OTP and update email
    console.log("New email updated:", newEmail);
    setProfileData(prev => ({
      ...prev,
      email: newEmail
    }));
    setShowNewEmailModal(false);
    setNewEmail("");
    setNewOtp("");
    setNewOtpSent(false);
  };

  const handleBack = () => {
    // Navigate back to previous page
    window.history.back();
  };

  const handleSave = () => {
    // Here you would typically save the profile data to backend
    console.log("Profile data saved:", profileData);
    showToast("Profile updated successfully!", "success");
  };

  return (
    <>
      <Header />
      {/* Back Button outside profile-container */}
      {/* Toast Notification outside profile-container, right side */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2000}
        />
      )}
      <div className="profile-back-wrapper">
        <button className="back-button" onClick={handleBack}>
          {/* Add left arrow icon */}
          <span style={{fontSize: '1.2em', marginRight: '6px', lineHeight: 1}}>&larr;</span>
          Back
        </button>
      </div>
      <div className="profile-container">
        <div className="profile-content">
          <h2 className="profile-title">Profile Page</h2>
          <div className="profile-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                readOnly
                className="form-input readonly"
              />
            </div>
            <div className="form-group">
              <label htmlFor="firstName">First Name:</label>
              <input
                type="text"
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number:</label>
              <input
                type="tel"
                id="mobileNumber"
                value={profileData.mobileNumber}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                className="form-input"
              />
            </div>
            <div className="button-group">
              {/* Update Email Button */}
              <button className="update-email-btn" onClick={handleUpdateEmail}>
                Update Email
              </button>
              {/* Save Button */}
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
        {/* First Modal - Old Email OTP */}
        {showUpdateEmailModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Verify Current Email</h3>
              <div className="form-group">
                <label htmlFor="currentEmail">Current Email:</label>
                <input
                  type="email"
                  id="currentEmail"
                  value={profileData.email}
                  className="form-input readonly"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP:</label>
                <div className="otp-input-group">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input"
                    placeholder="Enter OTP sent to your email"
                    disabled={!otpSent}
                  />
                  <button 
                    className="get-otp-btn" 
                    onClick={handleGetOtp}
                    disabled={otpSent}
                  >
                    {otpSent ? "OTP Sent" : "Get OTP"}
                  </button>
                </div>
              </div>
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel-btn" 
                  onClick={() => {
                    setShowUpdateEmailModal(false);
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn submit-btn" 
                  onClick={handleOldEmailSubmit}
                  disabled={!otpSent || !otp}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Second Modal - New Email */}
        {showNewEmailModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Enter New Email</h3>
              <div className="form-group">
                <label htmlFor="newEmail">New Email:</label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter new email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="newOtp">Enter OTP:</label>
                <div className="otp-input-group">
                  <input
                    type="text"
                    id="newOtp"
                    value={newOtp}
                    onChange={(e) => setNewOtp(e.target.value)}
                    className="form-input"
                    placeholder="Enter OTP sent to new email"
                    disabled={!newOtpSent}
                  />
                  <button 
                    className="get-otp-btn" 
                    onClick={handleGetNewOtp}
                    disabled={newOtpSent || !newEmail}
                  >
                    {newOtpSent ? "OTP Sent" : "Get OTP"}
                  </button>
                </div>
              </div>
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel-btn" 
                  onClick={() => {
                    setShowNewEmailModal(false);
                    setNewOtpSent(false);
                    setNewEmail("");
                    setNewOtp("");
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn submit-btn" 
                  onClick={handleNewEmailSubmit}
                  disabled={!newOtpSent || !newOtp || !newEmail}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </>
  );
};

export default Profile; 