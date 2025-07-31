import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { fetchAccounts } from '../../services/accountingApi';

function formatDate(dateStr) {
  if (!dateStr) return "-";
  // If already in dd-mm-yyyy, just return
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  // If in yyyy-mm-dd, convert to dd-mm-yyyy
  const [y, m, d] = dateStr.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return dateStr;
}

const Accounting = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getAccounts = async () => {
      setLoading(true);
      try {
        const data = await fetchAccounts();
        setAccounts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getAccounts();
  }, []);

  // Filtering logic - now shows one entry per person with total balance
  const getFilteredRows = () => {
    let rowNum = 1;
    let allRows = [];
    
    accounts.forEach(acc => {
      // Show only one entry per person with their total calculated balance
      if (
        (typeFilter === "All" || 
         (typeFilter === "Invoice" && acc.latest_transaction?.type === "Invoice") ||
         (typeFilter === "Buyer Debit" && acc.latest_transaction?.type === "Buyer") ||
         (typeFilter === "Other" && acc.latest_transaction?.type === "Other")) &&
        (searchFilter === "" || 
         acc.buyer_name.toLowerCase().includes(searchFilter.toLowerCase()) || 
         (acc.buyer_gst && acc.buyer_gst.toLowerCase().includes(searchFilter.toLowerCase())))
      ) {
        allRows.push(
          <tr key={`person-${acc.buyer_name}`}
            style={{ cursor: "pointer" }}
            onClick={() =>
              navigate("/account-statement", {
                state: {
                  buyer_name: acc.buyer_name,
                  buyer_address: acc.buyer_address,
                  buyer_gst: acc.buyer_gst,
                }
              })
            }
          >
            <td>{rowNum++}</td>
            <td>{acc.primary_type || "Mixed"}</td>
            <td>{acc.buyer_name}</td>
            <td style={{ 
              fontWeight: 'bold', 
              color: acc.net_amount > 0 ? '#d32f2f' : acc.net_amount < 0 ? '#2e7d32' : '#666'
            }}>
              ₹{Math.abs(acc.net_amount).toFixed(2)}
              <span style={{ fontSize: '10px', marginLeft: '5px', color: '#666' }}>
                ({acc.net_amount > 0 ? 'Debtor' : acc.net_amount < 0 ? 'Creditor' : 'Settled'})
              </span>
            </td>
            <td>{acc.latest_transaction?.date ? formatDate(acc.latest_transaction.date) : "-"}</td>
            <td>{acc.latest_transaction?.note || "-"}</td>
          </tr>
        );
      }
    });
    return allRows;
  };

  const handleClear = () => {
    setTypeFilter("All");
    setSearchFilter("");
  };

  return (
    <div>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "30px 0", maxWidth: 900, margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px #d9d5d5",
            padding: "32px 24px"
          }}>
            <h2 style={{ marginBottom: 16 }}>All Accounts</h2>
            
            {/* Info message about total balance */}
            <div style={{ 
              marginBottom: 16, 
              padding: '8px 12px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: 6, 
              fontSize: '12px',
              color: '#2e7d32',
              border: '1px solid #c8e6c9'
            }}>
              💡 <strong>Total Balance:</strong> Amount column shows the calculated total balance (Debtor/Creditor/Settled) for each person.
            </div>
            
            {/* Filter UI */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 ,alignItems: 'center' }}>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', height: '40px' , width: '200px'}}>
                <option value="All">All</option>
                <option value="Buyer Debit">Buyer</option>
                <option value="Invoice">Invoice</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Filter by Name or GST"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 , height: '40px' , width: '300px'}}
              />
              <button onClick={handleClear} style={{ padding: '8px 18px', borderRadius: 6, background: '#000', color: '#fff', border: 'none', fontWeight: 600 }}>Clear</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div>Loading...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRows().length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign: 'center'}}>No data</td></tr>
                  ) : getFilteredRows()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting; 