import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Header';
import '../../styles/UpdateLogo.css';

const UpdateLogo = () => {
  const navigate = useNavigate();
  const [logo1, setLogo1] = useState(null);
  const [logo2, setLogo2] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

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

  const handleUpload = (logoNum) => {
    toast.success(`Logo ${logoNum} uploaded successfully!`);
  };

  const handleCancel = () => {
    setLogo1(null);
    setLogo2(null);
    setPreview1(null);
    setPreview2(null);
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
              <input type="file" id="logo1" accept="image/*" onChange={handleLogo1Change} />
              {/* <label htmlFor="logo1">
                <i className="fas fa-upload"></i> Choose File
              </label> */}
              <button onClick={() => handleUpload(1)} disabled={!logo1}>
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
              <input type="file" id="logo2" accept="image/*" onChange={handleLogo2Change} />
              {/* <label htmlFor="logo2">
                <i className="fas fa-upload"></i> Choose File
              </label> */}
              <button onClick={() => handleUpload(2)} disabled={!logo2}>
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