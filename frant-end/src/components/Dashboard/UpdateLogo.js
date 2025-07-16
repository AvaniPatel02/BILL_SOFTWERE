import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Header';
import '../../styles/UpdateLogo.css';
import { getProfile } from '../../services/authApi';
import BASE_URL from '../../services/apiConfig';

const UpdateLogo = () => {
  const navigate = useNavigate();
  const [logo1, setLogo1] = useState(null);
  const [logo2, setLogo2] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

  // Fetch current logo URLs from backend using service API
  const fetchLogos = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const result = await getProfile(token);
      const data = result.data;
      setPreview1(data.image1 ? `${BASE_URL.replace(/\/api$/, '')}${data.image1}` : null);
      setPreview2(data.image2 ? `${BASE_URL.replace(/\/api$/, '')}${data.image2}` : null);
    } catch (err) {
      
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleLogo1Change = (e) => {
    const file = e.target.files[0];
    setLogo1(file);
    setPreview1(file ? URL.createObjectURL(file) : null);
  };

  const handleLogo2Change = (e) => {
    const file = e.target.files[0];
    setLogo2(file);
    setPreview2(file ? URL.createObjectURL(file) : null);
  };

  // Upload only logo1
  const handleUploadLogo1 = async () => {
    if (!logo1) {
      toast.error('Please select Logo 1 to upload.');
      return;
    }
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image1', logo1);

    try {
      const res = await fetch(`${BASE_URL}/auth/profile/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Logo 1 uploaded successfully!');
        setLogo1(null); // Clear file input
        await fetchLogos(); // Refresh preview from backend
      } else {
        toast.error('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
  };

  // Upload only logo2
  const handleUploadLogo2 = async () => {
    if (!logo2) {
      toast.error('Please select Logo 2 to upload.');
      return;
    }
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image2', logo2);

    try {
      const res = await fetch(`${BASE_URL}/auth/profile/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Logo 2 uploaded successfully!');
        setLogo2(null); // Clear file input
        await fetchLogos(); // Refresh preview from backend
      } else {
        toast.error('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
  };

  const handleCancel = () => {
    setLogo1(null);
    setLogo2(null);
    fetchLogos(); // Reset preview to backend logos
    toast.success('Upload cancelled');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <Header />
      <div className="update-logo-container">
        <ToastContainer />
        <div className="update-logo-content">
          {/* Back Button */}
          <button className="back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i> Back
          </button>

          {/* Logo Upload Section */}
          <div className="logo-upload-section">
            <div className="logo-upload">
              <label>Logo 1</label>
              {preview1 ? (
                <img src={preview1} alt="Logo 1 Preview" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  <i className="fas fa-image"></i>
                  <div className="placeholder-text">Sidebar Logo<br/>(Top Left)</div>
                </div>
              )}
              <input type="file" id="logo1" accept="image/*" onChange={handleLogo1Change} value="" />
              <div className="file-name">
                {logo1
                  ? logo1.name
                  : preview1
                    ? preview1.split('/').pop()
                    : 'No file chosen'}
              </div>
              <button onClick={handleUploadLogo1} disabled={!logo1}>
                <i className="fas fa-cloud-upload-alt"></i> Upload Logo 1
              </button>
            </div>
            <div className="logo-upload">
              <label>Logo 2</label>
              {preview2 ? (
                <img src={preview2} alt="Logo 2 Preview" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  <i className="fas fa-image"></i>
                  <div className="placeholder-text">Header Logo<br/>(Center)</div>
                </div>
              )}
              <input type="file" id="logo2" accept="image/*" onChange={handleLogo2Change} value="" />
              <div className="file-name">
                {logo2
                  ? logo2.name
                  : preview2
                    ? preview2.split('/').pop()
                    : 'No file chosen'}
              </div>
              <button onClick={handleUploadLogo2} disabled={!logo2}>
                <i className="fas fa-cloud-upload-alt"></i> Upload Logo 2
              </button>
            </div>
          </div>
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLogo; 