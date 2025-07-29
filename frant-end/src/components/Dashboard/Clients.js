import React, { useEffect, useState } from "react";
import ReactDOM from 'react-dom/client';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import '../../styles/Clients.css';
import { getInvoices, deleteInvoice, getInvoice } from '../../services/clientsApi';
import { getSettings } from '../../services/settingsApi';
import InvoicePDF from '../TaxInvoices/InvoicePDF';

const Clients = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const navigate = useNavigate();

//   navigate('/taxinvoices', {
//   state: {
//     buyerData: {
//       buyer_name: client.buyer_name,
//       buyer_address: client.buyer_address,
//       buyer_gst: client.buyer_gst,
//       country: latestInvoice?.country || 'India',
//       state: latestInvoice?.state || 'Gujarat',
//     }
//   }
// });

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate('/');
          return;
        }
        const data = await getInvoices();
        setInvoices(data);
      } catch (error) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [navigate]);

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

  const uniqueClients = React.useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) return [];
    
    const map = new Map();
    invoices.forEach(inv => {
      const key = `${inv.buyer_name}|${inv.buyer_address}|${inv.buyer_gst}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(inv);
    });
    
    let clients = Array.from(map.entries()).map(([key, invList]) => {
      // Sort by date (newest first)
      const sortedInvoices = invList.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
      
      return {
        buyer_name: invList[0].buyer_name,
        buyer_address: invList[0].buyer_address,
        buyer_gst: invList[0].buyer_gst,
        allInvoices: sortedInvoices
      };
    });

    // Filter based on search term
    if (searchFilter.trim()) {
      const filterLower = searchFilter.toLowerCase();
      clients = clients.filter(client => {
        // Check if client name matches
        if (client.buyer_name.toLowerCase().includes(filterLower)) {
          return true;
        }
        // Check if any invoice number matches
        return client.allInvoices.some(inv => 
          inv.invoice_number && inv.invoice_number.toLowerCase().includes(filterLower)
        );
      });
    }
    
    return clients;
  }, [invoices, searchFilter]);

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
        window.location.reload(); // or call fetchInvoices() if you want to avoid reload
      } catch (err) {
        alert('Failed to delete invoice: ' + err.message);
      }
    }
  };

  // Clear search filter
  const handleClearSearch = () => {
    setSearchFilter('');
  };

  const handleNewBill = (client) => {
    // Find the latest invoice for this client to get country and state
    const latestInvoice = client.allInvoices[0];
    navigate('/taxinvoices', {
      state: {
        buyerData: {
          buyer_name: client.buyer_name,
          buyer_address: client.buyer_address,
          buyer_gst: client.buyer_gst,
          country: latestInvoice?.country || 'India',
          state: latestInvoice?.state || 'Gujarat',
        }
      }
    });
  };

  // Group all invoices by financial year and find the max invoice for each year
  const maxInvoicePerYear = React.useMemo(() => {
    const map = {};
    invoices.forEach(inv => {
      const year = inv.financial_year;
      const num = parseInt((inv.invoice_number || '').split('-')[0]);
      if (!map[year] || num > map[year].num) {
        map[year] = { id: inv.id, num };
      }
    });
    return map;
  }, [invoices]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="client-year_container">
          <div className="client-hadar-container">
            <button className="client-back-btn" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
            </button>
            <div className="clients-search-container">
              <input
                type="text"
                placeholder="Search by name or bill number..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="clients-search-input"
              />
              <i className="fas fa-search clients-search-icon"></i>
              {searchFilter && (
                <button
                  className="clients-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <h1 className="client-title">Clients</h1>
            <button className="client-new-btn" onClick={() => navigate('/taxinvoices')}>
              + New Bill
            </button>
          </div>
          <div className="client-table-outer">
            <div className="client-table-container">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Buyer Name</th>
                    <th>Bill Number</th>
                    <th>Total Amount</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="client-text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : uniqueClients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="client-text-center">No clients found</td>
                    </tr>
                  ) : (
                    uniqueClients.map((client, idx) => {
                      return client.allInvoices.map((inv, billIdx) => (
                        <tr
                          key={inv.id}
                          style={{
                            background: idx % 2 === 0 ? '#fff' : '#f7f7f7',
                            borderBottom: billIdx === client.allInvoices.length - 1 ? '2px solid #bbb' : undefined
                          }}
                        >
                          {billIdx === 0 && (
                            <>
                              <td rowSpan={client.allInvoices.length} style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>
                                {idx + 1}
                              </td>
                              <td rowSpan={client.allInvoices.length} style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>
                                {client.buyer_name}
                              </td>
                            </>
                          )}
                          <td>{inv.invoice_number}</td>
                          <td>
                            {inv.currency} {parseFloat(inv.total_with_gst).toFixed(2)}
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <div className="client-tooltip-container">
                              <button
                                className="client-action-btn client-view"
                                onClick={() => handleView(inv.id)}
                                disabled={loading}
                              >
                                <i className="fa-regular fa-eye"></i>
                              </button>
                              <span className="client-tooltip-text">View</span>
                            </div>
                            <div className="client-tooltip-container">
                              <button
                                className="client-action-btn client-edit"
                                onClick={() => handleEdit(inv.id)}
                                disabled={loading}
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              <span className="client-tooltip-text">Edit</span>
                            </div>
                            <div className="client-tooltip-container">
                              <button
                                className="client-action-btn client-download"
                                onClick={() => handleDownload(inv.id)}
                                disabled={loading || (downloadingInvoice === inv.id)}
                              >
                                <i className={downloadingInvoice === inv.id ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"}></i>
                              </button>
                              <span className="client-tooltip-text">
                                {downloadingInvoice === inv.id ? 'Generating PDF...' : 'Download'}
                              </span>
                            </div>
                            <div className="client-tooltip-container">
                              <button
                                className="client-action-btn client-new"
                                onClick={() => handleNewBill(client)}
                                disabled={loading}
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                              <span className="client-tooltip-text">New Bill</span>
                            </div>
                            {maxInvoicePerYear[inv.financial_year]?.id === inv.id && (
                              <div className="client-tooltip-container">
                                <button
                                  className="client-action-btn client-delete"
                                  onClick={() => handleDelete(inv.id)}
                                  disabled={loading}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                                <span className="client-tooltip-text">Delete</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ));
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;




