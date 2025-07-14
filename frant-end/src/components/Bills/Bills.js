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
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container">
          <div className="bills-tabs">
            <button className="active">Tab 1</button>
            {/* Aap yahan aur tabs add kar sakte hain */}
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