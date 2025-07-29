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

  // Filtering logic
  const getFilteredRows = () => {
    let rowNum = 1;
    let allRows = [];
    let seenOther = {};
    accounts.forEach(acc => {
      // Invoices (debits)
      if (acc.invoices && acc.invoices.length > 0) {
        acc.invoices.forEach(inv => {
          if (
            (typeFilter === "All" || typeFilter === "Invoice") &&
            (searchFilter === "" || acc.buyer_name.toLowerCase().includes(searchFilter.toLowerCase()) || (acc.buyer_gst && acc.buyer_gst.toLowerCase().includes(searchFilter.toLowerCase())))
          ) {
            allRows.push(
              <tr key={`inv-${acc.buyer_name}-${inv.id}`}
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
                <td>Invoice</td>
                <td>{acc.buyer_name}</td>
                <td>{inv.total_with_gst !== undefined && inv.total_with_gst !== null ? Number(inv.total_with_gst).toFixed(2) : "-"}</td>
                <td>{inv.invoice_date ? formatDate(inv.invoice_date) : "-"}</td>
                <td>{inv.remark || "-"}</td>
              </tr>
            );
          }
        });
      }
      // Buyer debits
      if (acc.buyer_credits && acc.buyer_credits.length > 0) {
        acc.buyer_credits.forEach(bc => {
          if (
            (typeFilter === "All" || typeFilter === "Buyer Debit") &&
            (searchFilter === "" || acc.buyer_name.toLowerCase().includes(searchFilter.toLowerCase()) || (acc.buyer_gst && acc.buyer_gst.toLowerCase().includes(searchFilter.toLowerCase())))
          ) {
            allRows.push(
              <tr key={`buyer-${acc.buyer_name}-${bc.id}`}
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
                <td>Buyer</td>
                <td>{acc.buyer_name}</td>
                <td>{bc.amount !== undefined && bc.amount !== null ? Number(bc.amount).toFixed(2) : "-"}</td>
                <td>{bc.date ? formatDate(bc.date) : "-"}</td>
                <td>{bc.notes || "-"}</td>
              </tr>
            );
          }
        });
      }
      // Only one 'Other' entry per person
      if (acc.other_transactions && acc.other_transactions.length > 0) {
        const firstOther = acc.other_transactions.find(ot => !seenOther[acc.buyer_name]);
        if (firstOther && !seenOther[acc.buyer_name]) {
          if (
            (typeFilter === "All" || typeFilter === "Other") &&
            (searchFilter === "" || acc.buyer_name.toLowerCase().includes(searchFilter.toLowerCase()) || (acc.buyer_gst && acc.buyer_gst.toLowerCase().includes(searchFilter.toLowerCase())))
          ) {
            allRows.push(
              <tr key={`other-${acc.buyer_name}`}
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
                <td>Other</td>
                <td>{acc.buyer_name}</td>
                <td>{firstOther.amount !== undefined && firstOther.amount !== null ? Number(firstOther.amount).toFixed(2) : "-"}</td>
                <td>{firstOther.date ? formatDate(firstOther.date) : "-"}</td>
                <td>{firstOther.notice || "-"}</td>
              </tr>
            );
          }
          seenOther[acc.buyer_name] = true;
        }
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
        <div style={{ flex: 1, padding: "30px 0", maxWidth: '1300px', margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px #d9d5d5",
            padding: "32px 24px"
          }}>
            <h2 style={{ marginBottom: 16 }}>All Accounts</h2>
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