import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import '../../styles/Clients.css';
import { getInvoices } from '../../services/clientsApi';

const Clients = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch invoices from backend
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          // No token, redirect to login
          navigate('/');
          return;
        }
        const data = await getInvoices(); // Use service function
        setInvoices(data);
      } catch (error) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [navigate]);

  // Group by unique client (buyer_name, buyer_address, buyer_gst)
  const uniqueClients = React.useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) {
      return [];
    }
    
    const map = new Map();
    invoices.forEach(inv => {
      const key = `${inv.buyer_name}|${inv.buyer_address}|${inv.buyer_gst}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(inv);
    });
    // For each client, sort their invoices by date (most recent first)
    return Array.from(map.entries()).map(([key, invList]) => {
      invList.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
      return {
        buyer_name: invList[0].buyer_name,
        buyer_address: invList[0].buyer_address,
        buyer_gst: invList[0].buyer_gst,
        mostRecentInvoice: invList[0],
        allInvoices: invList
      };
    });
  }, [invoices]);

  // Action handlers
  const handleView = (invoiceId) => navigate(`/invoice-detail/${invoiceId}`);
  const handleEdit = (invoiceId) => navigate(`/edit-invoice/${invoiceId}`);
  const handleDownload = (invoiceId) => {
    alert('Download invoice ' + invoiceId);
  };
  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // const response = await deleteInvoice(token, invoiceId); // Use service function
      // if (response.status === 204) {
        // Remove the deleted invoice from the state
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      // } else if (response.status === 401) {
      //   localStorage.removeItem('access_token');
      //   navigate('/');
      // } else {
        alert('Failed to delete invoice.');
      // }
    } catch (error) {
      alert('Error deleting invoice.');
    } finally {
      setLoading(false);
    }
  };
  const handleNewBill = (client) => {
    navigate('/taxinvoices', {
      state: {
        buyerData: {
          buyer_name: client.buyer_name,
          buyer_address: client.buyer_address,
          buyer_gst: client.buyer_gst,
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="year_container">
          {/* Top bar with New Bills button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button
              className="back-btn"
              style={{
                padding: '8px 18px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #bbb',
                background: '#f1f3f4',
                cursor: 'pointer',
                fontWeight: 500
              }}
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
            </button>
            <button
              className="new-bill-btn"
              style={{ padding: '10px 24px', fontSize: '18px', borderRadius: '8px', background: '#17496a', color: '#fff', fontWeight: 600, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              onClick={() => navigate('/taxinvoices')}
            >
              <i className="fas fa-plus" style={{ marginRight: 8 }}></i> New Bills
            </button>
          </div>
          <div className="table-bordered main-box" style={{ border: "none", background: "#fff", borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.13)", padding: 0, marginLeft: 32, marginRight: 16, overflow: 'hidden' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#6c6c6c', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                  <th style={{ borderTopLeftRadius: 12, borderBottom: 'none' }}>No.</th>
                  <th>Buyer Name</th>
                  <th>Address</th>
                  <th>Bill Number</th>
                  <th>Total Amount</th>
                  <th style={{ borderTopRightRadius: 12 }}>items</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : uniqueClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No clients found</td>
                  </tr>
                ) : (
                  uniqueClients.map((client, idx) => (
                    <tr key={client.mostRecentInvoice.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                      <td>{idx + 1}</td>
                      <td>{client.buyer_name}</td>
                      <td>{client.buyer_address}</td>
                      <td>{client.mostRecentInvoice.invoice_number}</td>
                      <td>{client.mostRecentInvoice.currency} {parseFloat(client.mostRecentInvoice.total_with_gst).toFixed(2)}</td>
                      <td style={{ display: 'flex', justifyContent: 'center', gap: '10px', height:"80px" }}>
                        <div className="tooltip-container">
                          <button
                            className="action-btn view"
                            onClick={() => handleView(client.mostRecentInvoice.id)}
                            disabled={loading}
                          >
                            <i className="fa-regular fa-eye"></i>
                          </button>
                          <span className="tooltip-text">View</span>
                        </div>
                        <div className="tooltip-container">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(client.mostRecentInvoice.id)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <span className="tooltip-text">Edit</span>
                        </div>
                        <div className="tooltip-container">
                          <button
                            className="action-btn download"
                            onClick={() => handleDownload(client.mostRecentInvoice.id)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>
                          <span className="tooltip-text">Download</span>
                        </div>
                        <div className="tooltip-container">
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(client.mostRecentInvoice.id)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                          <span className="tooltip-text">Delete</span>
                        </div>
                        <div className="tooltip-container">
                          <button
                            className="action-btn new"
                            onClick={() => handleNewBill(client)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                          <span className="tooltip-text">New Bill</span>
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
  );
};

export default Clients; 