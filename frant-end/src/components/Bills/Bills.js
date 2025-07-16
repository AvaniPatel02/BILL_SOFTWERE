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
    // If after or on April 1, add a new year
    if (today.getMonth() > 3 || (today.getMonth() === 3 && today.getDate() >= 1)) {
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
  const currentYearRange = (today.getMonth() > 3 || (today.getMonth() === 3 && today.getDate() >= 1))
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;

  const handleRowClick = (year) => {
    navigate(`/bills/${year}`);
  };

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container">
          {/* Back button and title bar, similar to TaxInvoices */}
          <div className="bills-header-bar">
            <button className="bills-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h1 className="bills-title">Financial Year </h1>
          </div>
          
          <div className="bills-tab-content">
            <div className="bills-table-container">
              <table>
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
  );
};

export default Bills; 