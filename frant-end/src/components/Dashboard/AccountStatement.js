import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAccountStatement } from "../../services/accountingApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/TaxInvoices.css";

const AccountStatement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { buyer_name, buyer_address, buyer_gst } = location.state || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAccountStatement({
      buyer_name,
      buyer_address,
      buyer_gst,
      from_date: fromDate,
      to_date: toDate
    })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [buyer_name, buyer_address, buyer_gst, fromDate, toDate]);

  const handlePDF = () => {
    setIsGeneratingPDF(true);
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 15;
    doc.setFontSize(14);
    doc.text("Statement of Account", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 10;
    if (fromDate || toDate) {
      const dateText = `Statement${fromDate ? ` From: ${fromDate}` : ""}${toDate ? ` To: ${toDate}` : ""}`;
      doc.setFontSize(10);
      doc.text(dateText, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 8;
    }
    doc.setFontSize(11);
    doc.text(`Name: ${data.buyer_name}`, 10, cursorY);
    cursorY += 6;
    doc.text(`GST Number: ${data.buyer_gst}`, 10, cursorY);
    cursorY += 6;
    doc.text(`Total Balance: ₹ ${Number(data.total_balance).toFixed(2)}`, 10, cursorY);
    cursorY += 10;
    const tableRows = data.statement.map((entry) => [
      entry.date,
      entry.description,
      entry.credit ? `₹ ${Number(entry.credit).toFixed(2)}` : "-",
      entry.debit ? `₹ ${Math.abs(Number(entry.debit)).toFixed(2)}` : "-",
      `₹ ${Math.abs(Number(entry.balance)).toFixed(2)}`,
      entry.type
    ]);
    autoTable(doc, {
      startY: cursorY,
      head: [["Date", "Description", "Credit (Deposit)", "Debit (Invoice)", "Balance", "Type"]],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [111, 113, 114] },
      margin: { left: 10, right: 10 },
    });
    doc.save(`Statement-${data.buyer_name}.pdf`);
    setIsGeneratingPDF(false);
  };

  if (loading) return <div className="text-center p-6 text-lg">Loading statement...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return null;

  return (
    <div>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="container main-box" style={{ maxWidth: 800, marginTop: 40 }}>
          <h2 className="statement-heading" style={{ textAlign: "center", marginBottom: 24 }}>Statement of Account</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div className="mb-4 fs-5">
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
                <th>Type</th>
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
                  <td className="text-center">{row.type}</td>
                </tr>
              ))}
              <tr className="total-row" style={{ background: "#f2f2f2", fontWeight: 600 }}>
                <td colSpan={2} className="text-end p-2">Total:</td>
                <td className="text-right p-2">₹ {Number(data.total_credit).toFixed(2)}</td>
                <td className="text-right p-2">₹ {Math.abs(Number(data.total_debit)).toFixed(2)}</td>
                <td className="text-right p-2">₹ {Math.abs(Number(data.total_balance)).toFixed(2)}</td>
                <td></td>
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
              disabled={isGeneratingPDF}
            >
              📄 Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatement; 