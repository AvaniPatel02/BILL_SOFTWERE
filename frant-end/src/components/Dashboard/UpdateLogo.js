import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/UpdateLogo.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UpdateLogo = ({ history }) => {
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
    if (history && history.goBack) history.goBack();
    else window.history.back();
  };

  return (
    <div className="update-logo-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="update-logo-content">
          <ToastContainer />
          <button className="back-btn" onClick={handleBack}>Back</button>
          <h2>Update Logos</h2>
          <div className="logo-upload-section">
            <div className="logo-upload">
              <label>Logo 1</label>
              {preview1 ? (
                <img src={preview1} alt="Logo 1 Preview" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  
                  <div className="placeholder-text">Sidebar Logo<br/>(Top Left)</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleLogo1Change} />
              <button onClick={() => handleUpload(1)} disabled={!logo1}>Upload Logo 1</button>
            </div>
            <div className="logo-upload">
              <label>Logo 2</label>
              {preview2 ? (
                <img src={preview2} alt="Logo 2 Preview" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  
                  <div className="placeholder-text">Header Logo<br/>(Center)</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleLogo2Change} />
              <button onClick={() => handleUpload(2)} disabled={!logo2}>Upload Logo 2</button>
            </div>
          </div>
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLogo; 