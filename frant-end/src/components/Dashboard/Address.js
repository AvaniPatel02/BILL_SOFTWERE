import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import '../../styles/Address.css';
import { getInvoices } from '../../services/addressApi';

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Toast helper
  const showToast = (msg) => {
    if (window.toast) {
      window.toast(msg);
    } else if (window.ReactToastify && window.ReactToastify.toast) {
      window.ReactToastify.toast.success(msg);
    } else {
      // fallback
      alert(msg);
    }
  };

  // Fetch addresses from backend
  useEffect(() => {
    const getAddresses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const data = await getInvoices(); // Use service function
        setAddresses(data);
      } catch (error) {
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };
    getAddresses();
  }, []);

  // Remove duplicate addresses (same buyer_name, buyer_address, buyer_gst)
  const uniqueAddresses = React.useMemo(() => {
    const seen = new Set();
    return addresses.filter(addr => {
      const key = `${addr.buyer_name}|${addr.buyer_address}|${addr.buyer_gst}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [addresses]);

  // Copy address to clipboard
  const handleCopyAddress = (address) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(() => {
        showToast('Address copied to clipboard');
      });
    } else {
      // fallback for old browsers
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Address copied to clipboard');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="year_container">
          {/* Button Row with Centered Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginLeft: 20, marginRight: 20 }}>
            <button
              className="back-btn"
              style={{ padding: '8px 18px', fontSize: '16px', borderRadius: '6px', border: '1px solid #bbb', background: '#f1f3f4', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
            </button>
            <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontWeight: 700, fontSize: '2rem', letterSpacing: 1 }}>Address Book</h2>
            <button
              className="new-bill-btn"
              style={{ padding: '8px 18px', fontSize: '16px', borderRadius: '6px', border: '1px solid #bbb', background: '#cde6fa', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => navigate('/taxinvoices')}
            >
              <i className="fas fa-plus" style={{ marginRight: 8 }}></i> New Bill
            </button>
          </div>
          <div className="table-bordered main-box" style={{ border: "2px solid rgb(97, 94, 94)", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: 24, marginLeft: 32, marginRight: 16 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Buyer Name</th>
                  <th>Address</th>
                  <th>GSTIN/UIN</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center">Loading addresses...</td>
                  </tr>
                ) : addresses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No addresses found</td>
                  </tr>
                ) : (
                  uniqueAddresses.map((address, idx) => (
                    <tr key={address.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{address.buyer_name}</td>
                      <td
                        className="address-hover"
                        title="Click to copy address"
                        onClick={() => handleCopyAddress(address.buyer_address)}
                      >
                        {address.buyer_address}
                      </td>
                      <td>{address.buyer_gst}</td>
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

export default Address; 