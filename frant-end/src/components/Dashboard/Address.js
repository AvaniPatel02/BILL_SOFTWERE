import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import '../../styles/Address.css';
import { getInvoices } from '../../services/addressApi';

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
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
        if (!token) {
          navigate('/login');
          return;
        }
        const data = await getInvoices();
        setAddresses(Array.isArray(data) ? data : []);
      } catch (error) {
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };
    getAddresses();
  }, [navigate]);

  // Remove duplicate addresses (same buyer_name, buyer_address, buyer_gst)
  const uniqueAddresses = React.useMemo(() => {
    const seen = new Set();
    let filteredAddresses = addresses.filter(addr => {
      const key = `${addr.buyer_name}|${addr.buyer_address}|${addr.buyer_gst}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter based on search term
    if (searchFilter.trim()) {
      const filterLower = searchFilter.toLowerCase();
      filteredAddresses = filteredAddresses.filter(addr => {
        // Check if buyer name matches
        if (addr.buyer_name && addr.buyer_name.toLowerCase().includes(filterLower)) {
          return true;
        }
        // Check if address matches
        if (addr.buyer_address && addr.buyer_address.toLowerCase().includes(filterLower)) {
          return true;
        }
        // Check if GST matches
        if (addr.buyer_gst && addr.buyer_gst.toLowerCase().includes(filterLower)) {
          return true;
        }
        return false;
      });
    }
    
    return filteredAddresses;
  }, [addresses, searchFilter]);

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

  // Clear search filter
  const handleClearSearch = () => {
    setSearchFilter('');
  };

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="address-container address-book-container">
          <div className="address-header-group">
            <button className="address-back-btn" onClick={() => navigate(-1)}>Back</button>
            <div className="address-search-container">
              <input
                type="text"
                placeholder="Search by name, address or GST..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="address-search-input"
              />
              <i className="fas fa-search address-search-icon"></i>
              {searchFilter && (
                <button
                  className="address-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <h1 className="address-title">Address Book</h1>
            <button
              className="address-new-btn"
              onClick={() => {
                if (uniqueAddresses.length > 0) {
                  // पहले एड्रेस के डेटा के साथ नेविगेट करें
                  const selectedAddress = uniqueAddresses[0];
                  navigate('/taxinvoices', {
                    state: {
                      buyerData: {
                        buyer_name: selectedAddress.buyer_name,
                        buyer_address: selectedAddress.buyer_address,
                        buyer_gst: selectedAddress.buyer_gst,
                        country: 'India', // डिफ़ॉल्ट देश
                        state: 'Gujarat', // डिफ़ॉल्ट राज्य
                      }
                    }
                  });
                } else {
                  // कोई एड्रेस नहीं है तो सीधे नेविगेट करें
                  navigate('/taxinvoices');
                }
              }}
            >
              + New Bill
            </button>
          </div>
          <div className="address-table-outer">
            <div className="address-table-container">
              <table className="address-table">
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
                          title={address.buyer_address}
                          onClick={() => handleCopyAddress(address.buyer_address)}
                        >
                          {address.buyer_address && address.buyer_address.length > 50
                            ? address.buyer_address.slice(0, 50) + '...'
                            : address.buyer_address}
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
    </div>
  );
};

export default Address;