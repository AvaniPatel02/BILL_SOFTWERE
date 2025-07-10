import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import '../../styles/Settings.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import Toast from '../Toast';
import { fetchSettings, updateSettings } from '../../services/settingsApi';

const SettingsPage = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    seller_pan: '',
    seller_address: '',
    seller_gstin: '',
    seller_email: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    bank_account_holder: '',
    branch: '',
    swift_code: '',
    HSN_codes: [],
    logo: null,
    logoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [newHsn, setNewHsn] = useState('');
  const [token, setToken] = useState(""); // Get your JWT token from auth context or localStorage

  useEffect(() => {
    // Get token from localStorage or context
    const t = localStorage.getItem("accessToken");
    setToken(t);

    if (t) {
      setLoading(true);
      fetchSettings(t).then(res => {
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            ...res.data,
            HSN_codes: Array.isArray(res.data.HSN_codes) ? res.data.HSN_codes : [],
            logoUrl: res.data.logo ? res.data.logo : '',
            logo: null,
          }));
        }
        setLoading(false);
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addHsnCode = (e) => {
    e.preventDefault();
    if (newHsn.trim() !== '' && !formData.HSN_codes.includes(newHsn.trim())) {
      setFormData((prev) => ({ ...prev, HSN_codes: [...prev.HSN_codes, newHsn.trim()] }));
      setNewHsn('');
    }
  };

  const removeHsnCode = (index) => {
    setFormData((prev) => ({
      ...prev,
      HSN_codes: prev.HSN_codes.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSettings(formData, token);
    setLoading(false);
    if (res.success) {
      alert("Settings updated successfully!");
    } else {
      alert("Failed to update settings.");
    }
  };

  return (
   <div style={{ paddingLeft: "60px" }}>
      <h1 className="hedding">Your Company details</h1>

      <div className="formbody">
        <div className="form-box">
          <div className="form-row">
            <div className="fastinput">
              <label>Company name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="Company name"
              />
            </div>
            <div className="fastinput">
              <label>PAN Number</label>
              <input
                type="text"
                name="seller_pan"
                value={formData.seller_pan || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="PAN Number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Seller Address</label>
              <textarea
                name="seller_address"
                value={formData.seller_address || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Seller Address"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>GST Number</label>
              <input
                type="text"
                name="seller_gstin"
                value={formData.seller_gstin || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="GST Number"
              />
            </div>
            <div className="fastinput">
              <label>Email</label>
              <input
                type="email"
                name="seller_email"
                value={formData.seller_email || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="Email"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="Bank Name"
              />
            </div>
            <div className="fastinput">
              <label>Account Number</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="Account Number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="IFSC Code"
              />
            </div>
            <div className="fastinput">
              <label>A/c Holder's Name</label>
              <input
                type="text"
                name="bank_account_holder"
                value={formData.bank_account_holder || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="A/c Holder's Name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="Branch"
              />
            </div>
            <div className="fastinput">
              <label>SWIFT Code</label>
              <input
                type="text"
                name="swift_code"
                value={formData.swift_code || ""}
                onChange={handleChange}
                disabled={loading}
                placeholder="SWIFT Code"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput" style={{ width: '50%' }}>
              <label>HSN Codes</label>
              <div className="hsn-input-group">
                <input
                  type="text"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  disabled={loading}
                  placeholder="HSN Code"
                />
                <button className="hsn-add-btn" onClick={addHsnCode} disabled={loading}>Add</button>
              </div>
              <div className="hsn-code-list">
                {formData.HSN_codes.map((code, index) => (
                  <div key={index} className="hsn-code-item">
                    <span>{code}</span>
                    <button className="hsn-remove-btn" onClick={() => removeHsnCode(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="fastinput" style={{ width: '50%' }}>
              <label>Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                placeholder="Upload Logo"
              />
              {formData.logoUrl && (
                <div className="upload-preview">
                  <img src={formData.logoUrl} alt="Preview" className="preview-image" />
                </div>
              )}
            </div>
          </div>

          <div className="buttonuplod">
            <button
              className="button-sumbit-banking btn-all"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 