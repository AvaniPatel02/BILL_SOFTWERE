import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Accounting = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/api/accounts/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch accounts");
        const data = await res.json();
        setAccounts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

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
                  {accounts.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign: 'center'}}>No data</td></tr>
                  ) : (() => {
                    let rowNum = 1;
                    let allRows = [];
                    accounts.forEach(acc => {
                      // Invoices (debits)
                      if (acc.invoices && acc.invoices.length > 0) {
                        acc.invoices.forEach(inv => {
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
                              <td>{inv.invoice_date ? inv.invoice_date : "-"}</td>
                              <td>{inv.remark || "-"}</td>
                            </tr>
                          );
                        });
                      }
                      // Buyer debits
                      if (acc.buyer_credits && acc.buyer_credits.length > 0) {
                        acc.buyer_credits.forEach(bc => {
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
                              <td>Buyer Debit</td>
                              <td>{acc.buyer_name}</td>
                              <td>{bc.amount !== undefined && bc.amount !== null ? Number(bc.amount).toFixed(2) : "-"}</td>
                              <td>{bc.date || "-"}</td>
                              <td>{bc.notes || "-"}</td>
                            </tr>
                          );
                        });
                      }
                    });
                    return allRows;
                  })()}
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