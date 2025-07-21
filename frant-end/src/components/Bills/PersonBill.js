import React, { useEffect, useState } from 'react';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import '../../styles/PersonBill.css';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoices } from '../../services/calculateInvoiceApi';

const PersonBill = () => {
  const navigate = useNavigate();
  const { year, buyerName } = useParams();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    setLoading(true);
    setError(null);
    getInvoices(year)
      .then(data => {
        // Convert year to match API format (2025-2026 => 2025/2026)
        const apiYear = year.replace('-', '/');
        // Filter bills for the selected buyer and year in invoice_number or financial_year
        const filtered = data.filter(bill =>
          (bill.buyer_name || '').toLowerCase() === decodeURIComponent(buyerName).toLowerCase() &&
          (
            (bill.invoice_number || '').includes(apiYear) ||
            (bill.financial_year || '') === apiYear
          )
        );
        setBills(filtered);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch bills');
        setLoading(false);
      });
  }, [year, buyerName]);

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container ">
          <div className="personbill-header-group">
            <button className="personbill-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h1 className="personbill-title">Bills for {buyerName} ({year})</h1>
          </div>
          <div className="personbill-table-outer">
            <div className="bills-tab-content">
              <div className="personbill-table-container">
                {loading ? (
                  <p>Loading bills...</p>
                ) : error ? (
                  <p style={{ color: 'red' }}>{error}</p>
                ) : bills.length === 0 ? (
                  <p>No bills found for {buyerName} in {year}.</p>
                ) : (
                  <table className="personbill-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Invoice No</th>
                        <th>GST Number</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill, idx) => (
                        <tr key={bill.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{bill.buyer_name}</td>
                          <td>{bill.invoice_number}</td>
                          <td
                            title={bill.buyer_gst}
                          >
                            {bill.buyer_gst && bill.buyer_gst.length > 15
                              ? bill.buyer_gst.slice(0, 15) + '...'
                              : bill.buyer_gst}
                          </td>
                          <td>{bill.invoice_date}</td>
                          <td>{bill.total_amount || bill.total_with_gst}</td>
                          <td>
                            <button className="personbill-action-btn">View</button>
                            <button className="personbill-action-btn">Download</button>
                            <button className="personbill-action-btn">New Bill</button>
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
    </div>
  );
};

export default PersonBill; 