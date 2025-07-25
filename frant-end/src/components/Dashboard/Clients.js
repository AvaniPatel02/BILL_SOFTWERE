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
    
    return Array.from(map.entries()).map(([key, invList]) => {
      // Sort by date (newest first)
      const sortedInvoices = invList.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
      
      return {
        buyer_name: invList[0].buyer_name,
        buyer_address: invList[0].buyer_address,
        buyer_gst: invList[0].buyer_gst,
        allInvoices: sortedInvoices
      };
    });
  }, [invoices]);

  const handleView = (invoiceId) => navigate(`/view-bill/${invoiceId}`);
  const handleEdit = (invoiceId) => navigate(`/edit-invoice/${invoiceId}`);
  const handleDownload = (invoiceId) => alert('Download invoice ' + invoiceId);

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
                                disabled={loading}
                              >
                                <i className="fa-solid fa-download"></i>
                              </button>
                              <span className="client-tooltip-text">Download</span>
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