import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import '../../styles/PersonBill.css';
import '../../styles/Clients.css';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoices } from '../../services/calculateInvoiceApi';
import { getInvoice, deleteInvoice } from '../../services/clientsApi';
import { getSettings } from '../../services/settingsApi';
import InvoicePDF from '../TaxInvoices/InvoicePDF';

// Helper to format date from yyyy-mm-dd to dd-mm-yyyy
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

const PersonBill = () => {
  const navigate = useNavigate();
  const { year, buyerName } = useParams();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [settings, setSettings] = useState(null);

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

  // Load settings for PDF generation
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await getSettings();
        setSettings(settingsData.data || settingsData);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleView = (invoiceId) => navigate(`/view-bill/${invoiceId}`);
  const handleEdit = (invoiceId) => navigate(`/edit-invoice/${invoiceId}`);
  const handleDownload = async (invoiceId) => {
    try {
      setDownloadingInvoice(invoiceId);
      const invoiceData = await getInvoice(invoiceId);
      
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.zIndex = '-1';
      document.body.appendChild(tempDiv);
      
      // Render the PDF component in the temporary div
      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <InvoicePDF 
          invoice={invoiceData} 
          settings={settings} 
          onDownloadComplete={() => {
            setDownloadingInvoice(null);
            document.body.removeChild(tempDiv);
            root.unmount();
          }}
        />
      );
    } catch (error) {
      alert('Failed to download invoice: ' + error.message);
      setDownloadingInvoice(null);
    }
  };
  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId);
        alert('Invoice deleted successfully!');
        window.location.reload();
      } catch (err) {
        alert('Failed to delete invoice: ' + err.message);
      }
    }
  };

  const handleNewBill = (bill) => {
    navigate('/taxinvoices', {
      state: {
        buyerData: {
          buyer_name: bill.buyer_name,
          buyer_address: bill.buyer_address,
          buyer_gst: bill.buyer_gst,
          country: bill.country || 'India',
          state: bill.state || 'Gujarat',
        }
      }
    });
  };

    return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="personbill-container">
          <div className="personbill-year_container">
            <div className="personbill-hadar-container">
              <button className="personbill-back-btn" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
              </button>
              <h1 className="personbill-title">Bills for {buyerName} ({year})</h1>
              <button className="personbill-new-btn" onClick={() => navigate('/taxinvoices')}>
                + New Bill
              </button>
            </div>
            <div className="personbill-table-outer">
              <div className="personbill-table-container">
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
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="personbill-text-center">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7" className="personbill-text-center" style={{ color: 'red' }}>{error}</td>
                      </tr>
                    ) : bills.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="personbill-text-center">No bills found for {buyerName} in {year}.</td>
                      </tr>
                    ) : (
                      bills.map((bill, idx) => (
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
                          <td>{formatDate(bill.invoice_date)}</td>
                          <td>
                            {bill.currency} {parseFloat(bill.total_with_gst || bill.total_amount || 0).toFixed(2)}
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <div className="personbill-tooltip-container">
                              <button
                                className="personbill-action-btn personbill-view"
                                onClick={() => handleView(bill.id)}
                                disabled={loading}
                              >
                                <i className="fa-regular fa-eye"></i>
                              </button>
                              <span className="personbill-tooltip-text">View</span>
                            </div>
                            <div className="personbill-tooltip-container">
                              <button
                                className="personbill-action-btn personbill-download"
                                onClick={() => handleDownload(bill.id)}
                                disabled={loading || (downloadingInvoice === bill.id)}
                              >
                                <i className={downloadingInvoice === bill.id ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"}></i>
                              </button>
                              <span className="personbill-tooltip-text">
                                {downloadingInvoice === bill.id ? 'Generating PDF...' : 'Download'}
                              </span>
                            </div>
                            <div className="personbill-tooltip-container">
                              <button
                                className="personbill-action-btn personbill-new"
                                onClick={() => handleNewBill(bill)}
                                disabled={loading}
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                              <span className="personbill-tooltip-text">New Bill</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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

export default PersonBill; 