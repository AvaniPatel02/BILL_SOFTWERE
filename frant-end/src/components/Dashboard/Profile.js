import React, { useState, useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "../../services/authApi";
import { toast, ToastContainer } from "react-toastify";
import "../styles/Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ first_name: "", mobile: "", email: "" });
  const [emailStep, setEmailStep] = useState(0); 
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");
  const token = localStorage.getItem("token");

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");
      const res = await getProfile(token);
      if (res.success) {
        setProfile({
          email: res.data.email,
          first_name: res.data.first_name,
          mobile: res.data.mobile
        });
        setForm({
          first_name: res.data.first_name,
          mobile: res.data.mobile,
          email: res.data.email
        });
      } else {
        toast.error("Failed to fetch profile");
      }
    }
    fetchProfile();
  }, [token]);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save name and mobile
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const res = await updateProfile(token, {
      first_name: profile.first_name,
      mobile: profile.mobile
    });
    if (res.success) {
      toast.success("Profile updated!");
      setEdit(false);
      setProfile({ ...profile, first_name: profile.first_name, mobile: profile.mobile });
    } else {
      toast.error("Failed to update profile");
    }
  };

  // Start email change process
  const startEmailChange = async () => {
    const token = localStorage.getItem("token");
    const res = await sendCurrentEmailOtp(token);
    if (res.success) {
      setEmailStep(1);
      toast.success("OTP sent to current email");
    } else {
      toast.error(res.message || "Failed to send OTP");
    }
  };

  // Verify current email OTP
  const handleVerifyCurrentEmailOtp = async () => {
    const token = localStorage.getItem("token");
    const res = await verifyCurrentEmailOtp(token, currentEmailOtp);
    if (res.success) {
      setEmailStep(2); // Move to the next step: enter new email
      toast.success("Current email verified! Enter new email.");
    } else {
      toast.error(res.message || "Invalid OTP");
    }
  };

  // Send OTP to new email
  const handleSendNewEmailOtp = async () => {
    const token = localStorage.getItem("token");
    const res = await sendNewEmailOtp(token, newEmail);
    if (res.success) {
      setEmailStep(3);
      toast.success("OTP sent to new email");
    } else {
      toast.error(res.message || "Failed to send OTP to new email");
    }
  };

  // Verify new email OTP
  const handleVerifyNewEmailOtp = async () => {
    const token = localStorage.getItem("token");
    const res = await verifyNewEmailOtp(token, newEmailOtp);
    if (res.success) {
      setEmailStep(4);
      toast.success("New email verified! Click update to finish.");
    } else {
      toast.error(res.message || "Invalid OTP");
    }
  };

  // Update email in backend
  const handleUpdateEmail = async () => {
    const token = localStorage.getItem("token");
    const res = await updateEmail(token);
    if (res.success) {
      toast.success("Email updated!");
      setProfile({ ...profile, email: newEmail });
      setForm({ ...form, email: newEmail });
      setEmailStep(0);
      setNewEmail("");
      setNewEmailOtp("");
      setCurrentEmailOtp("");
    } else {
      toast.error(res.message || "Failed to update email");
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <ToastContainer />
      <h2>Profile</h2>
      <div>
        <label>Name:</label>
        <input name="first_name" value={form.first_name} onChange={handleChange} disabled={!edit} />
      </div>
      <div>
        <label>Mobile:</label>
        <input name="mobile" value={form.mobile} onChange={handleChange} disabled={!edit} />
      </div>
      <div>
        <label>Email:</label>
        <input name="email" value={form.email} disabled />
        <button onClick={startEmailChange}>Change Email</button>
      </div>
      {edit && <button onClick={handleSave}>Save</button>}
      {!edit && <button onClick={() => setEdit(true)}>Edit</button>}

      {/* Email change steps */}
      {emailStep === 1 && (
        <div>
          <input
            value={currentEmailOtp}
            onChange={e => setCurrentEmailOtp(e.target.value)}
            placeholder="Enter OTP sent to current email"
          />
          <button onClick={handleVerifyCurrentEmailOtp}>Verify Current Email OTP</button>
        </div>
      )}
      {emailStep === 2 && (
        <div>
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Enter new email"
          />
          <button onClick={handleSendNewEmailOtp}>Send OTP to New Email</button>
        </div>
      )}
      {emailStep === 3 && (
        <div>
          <input value={newEmailOtp} onChange={e => setNewEmailOtp(e.target.value)} placeholder="Enter OTP sent to new email" />
          <button onClick={handleVerifyNewEmailOtp}>Verify New Email OTP</button>
        </div>
      )}
      {emailStep === 4 && (
        <div>
          <button onClick={handleUpdateEmail}>Update Email</button>
        </div>
      )}
    </div>
  );
};

export default Profile; 