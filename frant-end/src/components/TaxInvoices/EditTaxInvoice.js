// editTaxinvoice.js

import React from 'react';
import Sidebar from '../Dashboard/Sidebar';
import Header from '../Dashboard/Header';

import { useNavigate } from 'react-router-dom';

const EditTaxinvoice = () => {
  const navigate = useNavigate();

  return (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
       <Sidebar />
       <div style={{ flex: 1 }}>
         <Header />
        <div style={{ padding: '20px' }}>
          <button
            className="client-back-btn"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
          </button>
          <h1>Edit Tax Invoice</h1>
          {/* Add your edit invoice form or logic here */}
        </div>
      </div>
    </div>
  );
};

export default EditTaxinvoice;
