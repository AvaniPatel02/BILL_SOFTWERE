import React from 'react';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import '../../styles/Bills.css';
import { useNavigate } from 'react-router-dom';

const Bills = () => {
  const navigate = useNavigate();
  // Helper to get current year range
  const getYearRanges = () => {
    const startYear = 2023;
    const today = new Date();
    let currentYear = today.getFullYear();
    // If after April 1, add a new year
    if (today.getMonth() > 2 || (today.getMonth() === 2 && today.getDate() >= 1)) {
      currentYear += 1;
    }
    const years = [];
    for (let y = startYear; y < currentYear; y++) {
      years.push(`${y}-${y + 1}`);
    }
    return years;
  };

  const yearRanges = getYearRanges();
  // Current year range string
  const today = new Date();
  const currentYearRange = today.getMonth() > 2 || (today.getMonth() === 2 && today.getDate() >= 1)
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;

  const handleRowClick = (year) => {
    navigate(`/bills/${year}`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="bills-container">
          <div className="bills-year_container">
            <div className="bills-hadar-container">
              <button className="bills-back-btn" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
              </button>
              <h1 className="bills-title">Bills by Year</h1>
              <button className="bills-new-btn" onClick={() => navigate('/taxinvoices')}>
                + New Bill
              </button>
            </div>
            <div className="bills-table-outer">
              <div className="bills-table-container">
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearRanges.map((year) => (
                      <tr
                        key={year}
                        className={year === currentYearRange ? 'active-year-row' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(year)}
                      >
                        <td>{year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bills; 