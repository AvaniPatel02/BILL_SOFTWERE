import React, { useEffect, useState } from 'react';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import styles from '../../styles/YearBills.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchInvoicesByYear } from '../../services/calculateInvoiceApi';

const YearBills = () => {
  const navigate = useNavigate();
  const { year } = useParams();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    setLoading(true);
    setError(null);
    fetchInvoicesByYear(year, token)
      .then(data => {
        // Convert year to match API format (2025-2026 => 2025/2026)
        const apiYear = year.replace('-', '/');
        // Filter bills for the selected year in invoice_number or financial_year
        const filtered = data.filter(bill =>
          (bill.invoice_number || '').includes(apiYear) ||
          (bill.financial_year || '') === apiYear
        );
        setBills(filtered);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch bills');
        setLoading(false);
      });
  }, [year]);

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container">
          <div className={styles['yearbills-header-bar']}>
            <button className={styles['yearbills-back-btn']} onClick={() => navigate(-1)}>Back</button>
            <h1 className={styles['yearbills-title']}>Bills for  {year}</h1>
          </div>
          <div className="bills-tab-content">
            <div className={styles['yearbills-table-container']}>
              {loading ? (
                <p>Loading bills...</p>
              ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
              ) : bills.length === 0 ? (
                <p>No bills found for {year}.</p>
              ) : (
                <table className={styles['yearbills-table']}>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Name</th>
                      <th>GST Number</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill, idx) => (
                      <tr key={bill.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{bill.buyer_name}</td>
                        <td>{bill.buyer_gst}</td>
                        <td>{bill.invoice_date}</td>
                        <td>
                          <button className={styles['yearbills-view-btn']} onClick={() => navigate(`/bills/${year}/${encodeURIComponent(bill.buyer_name)}`)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearBills; 