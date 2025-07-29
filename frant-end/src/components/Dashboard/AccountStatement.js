import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactDOM from 'react-dom/client';
import { fetchAccountStatement } from "../../services/accountingApi";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/TaxInvoices.css";
import AccountStatementPDF from './AccountStatementPDF';

const AccountStatement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { buyer_name, buyer_address, buyer_gst } = location.state || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    
    console.log('Fetching account statement with params:', {
      buyer_name,
      buyer_address,
      buyer_gst,
      from_date: fromDate,
      to_date: toDate
    });

    fetchAccountStatement({
      buyer_name,
      buyer_address,
      buyer_gst,
      from_date: fromDate,
      to_date: toDate
    })
      .then(response => {
        console.log('Account statement response:', response);
        setData(response);
      })
      .catch(e => {
        console.error('Account statement error:', e);
        setError(e.message || 'Failed to fetch account statement');
      })
      .finally(() => setLoading(false));
  }, [buyer_name, buyer_address, buyer_gst, fromDate, toDate]);

  const handlePDF = async () => {
    try {
      setDownloadingPDF(true);

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.zIndex = '-1';
      document.body.appendChild(tempDiv);

      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <AccountStatementPDF
          data={data}
          fromDate={fromDate}
          toDate={toDate}
          onDownloadComplete={() => {
            setDownloadingPDF(false);
            document.body.removeChild(tempDiv);
            root.unmount();
          }}
        />
      );
    } catch (error) {
      alert('Failed to generate PDF: ' + error.message);
      setDownloadingPDF(false);
    }
  };

  if (loading) return <div className="text-center p-6 text-lg">Loading statement...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center p-6 text-lg">No data available</div>;

  // Validate data structure
  if (!data.buyer_name || !data.statement) {
    console.error('Invalid data structure:', data);
    return <div className="text-center p-6 text-lg">Invalid data format</div>;
  }

  return (
    <div>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="container main-box" style={{ maxWidth: 1300, marginTop: 40,padding :'30px'}}>
          <h2 className="statement-heading" style={{ textAlign: "center", marginBottom: 24 }}>Statement of Account</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div className="mb-3">
              <p><strong>Name:</strong> {data.buyer_name}</p>
              <p><strong>GST Number:</strong> {data.buyer_gst}</p>
              <p><strong>Total Balance:</strong> ₹ {Math.abs(Number(data.total_balance)).toFixed(2)}</p>
            </div>
            <div className="mb-4 flex gap-4 items-center">
              <div>
                <label className="block font-semibold">From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="border rounded px-2 py-1"
                  style={{ width: "180px" }}
                />
              </div>
              <div>
                <label className="block font-semibold">To Date:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="border rounded px-2 py-1"
                  style={{ width: "180px" }}
                />
              </div>
            </div>
          </div>
          <h4 className="activity-title" style={{ background: "#757575", color: "#fff", padding: 8, borderRadius: 6, textAlign: "center" }}>Account Activity</h4>
          <table className="invoice-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Credit (Deposit)</th>
                <th>Debit (Invoice)</th>
                <th>Balance</th>
                {/* <th>Type</th> */}
              </tr>
            </thead>
            <tbody>
              {data.statement.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center">{row.date}</td>
                  <td className="text-center">{row.description}</td>
                  <td className="text-right">{row.credit ? `₹ ${Number(row.credit).toFixed(2)}` : "-"}</td>
                  <td className="text-right">{row.debit ? `₹ ${Math.abs(Number(row.debit)).toFixed(2)}` : "-"}</td>
                  <td className="text-right">₹ {Math.abs(Number(row.balance)).toFixed(2)}</td>
                  {/* <td className="text-center">{row.type}</td> */}
                </tr>
              ))}
              <tr className="total-row" style={{ background: "#f2f2f2", fontWeight: 600 }}>
                <td colSpan={2} className="text-end p-2">Total:</td>
                <td className="text-right p-2">₹ {Number(data.total_credit).toFixed(2)}</td>
                <td className="text-right p-2">₹ {Math.abs(Number(data.total_debit)).toFixed(2)}</td>
                <td className="text-right p-2">₹ {Math.abs(Number(data.total_balance)).toFixed(2)}</td>
                {/* <td></td> */}
              </tr>
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24 }}>
            <button
              onClick={() => navigate(-1)}
              className="download-btn"
              style={{ background: "#374151", minWidth: 120 }}
            >
              ← Go Back
            </button>
            <button
              onClick={handlePDF}
              className="download-btn"
              style={{ background: "#0d47a1", minWidth: 180 }}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? '📄 Generating PDF...' : '📄 Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatement; 