import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Buyer.css";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getBuyers, addBuyer, addBuyerName, fetchAllBuyerData } from '../../services/buyerApi';
import { fetchBanks } from '../../services/bankCashApi';
import { useEffect } from 'react';

const Buyer = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    date: '', 
    amount: '', 
    notes: '', 
    paymentType: 'Bank', 
    bank: '' 
  });
  const [buyers, setBuyers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get token from localStorage (adjust if you use a different auth system)
  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [buyersData, banksData] = await Promise.all([
        fetchAllBuyerData(), // Now only Buyer model data
        fetchBanks()
      ]);
      setBuyers(buyersData);
      if (Array.isArray(banksData)) {
        setBanks(banksData);
      } else if (banksData && Array.isArray(banksData.results)) {
        setBanks(banksData.results);
      }
    } catch (err) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getBankAmount = (bankName) => {
    if (!banks || banks.length === 0) return '₹0.00';
    const bank = banks.find(b => b.bank_name === bankName);
    return bank ? `₹${bank.amount}` : '₹0.00';
  };

  const handleSave = async () => {
    setError('');
    try {
      const payload = {
        name: form.name,
        date: form.date || new Date().toISOString().split('T')[0],
        amount: Number(form.amount) || 0,
        notes: form.notes || '',
        payment_type: form.paymentType || 'Cash',
        bank: form.paymentType === 'Bank' ? form.bank : ''
      };
      const newBuyer = await addBuyerName(payload);
      setBuyers(prev => [...prev, newBuyer]);
      setShowModal(false);
      setForm({ 
        name: '', 
        date: '', 
        amount: '', 
        notes: '', 
        paymentType: 'Bank', 
        bank: '' 
      });
    } catch (err) {
      setError('Failed to save buyer');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setForm({ 
      name: '', 
      date: '', 
      amount: '', 
      notes: '', 
      paymentType: 'Bank', 
      bank: '' 
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="buyer-content">
          <div className="buyer-header-group">
            <button className="buyer-back-btn" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
            </button>
            <h2 style={{ margin: 0, flex: 1, textAlign: 'center', color: '#333', fontSize: '2rem', fontWeight: 700 }}>Buyer Transactions</h2>
            <button className="buyer-newbill-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus" style={{ marginRight: 8 }}></i> New Buyer
            </button>
          </div>
          
          <div style={{ 
            backgroundColor: '#e7f3ff', 
            border: '1px solid #b3d9ff', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '25px',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <strong>ℹ️ Unified Buyer Model:</strong> All buyer transactions are now stored in a single Buyer model. 
            Data from both Buyer.js form and Banking.js form goes to the same database table.
          </div>

          {showModal && (
            <div className="buyer-modal-overlay">
              <div className="buyer-modal">
                <h3>New Buyer</h3>
                <label>Name
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter buyer name" />
                </label>
                <label>Date
                  <input type="date" name="date" value={form.date} onChange={handleChange} />
                </label>
                <label>Amount
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Enter amount" />
                </label>
                <label>Notes
                  <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Enter notes (optional)" />
                </label>
                <label>Payment Type
                  <select name="paymentType" value={form.paymentType} onChange={handleChange}>
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </label>
                {form.paymentType === 'Bank' && (
                  <label>Bank
                    <select name="bank" value={form.bank || ''} onChange={handleChange}>
                      <option value="">Select Bank</option>
                      {banks && banks.length > 0 ? banks.map(bank => (
                        <option key={bank.id} value={bank.bank_name}>
                          {bank.bank_name} ({getBankAmount(bank.bank_name)})
                        </option>
                      )) : (
                        <option value="" disabled>Loading banks...</option>
                      )}
                    </select>
                  </label>
                )}
                <div className="buyer-modal-btns">
                  <button className="buyer-modal-save" onClick={handleSave}>Save</button>
                  <button className="buyer-modal-cancel" onClick={handleCancel}>Cancel</button>
                </div>
                {error && <div style={{color:'red', fontSize: '14px', textAlign: 'center'}}>{error}</div>}
              </div>
            </div>
          )}

          {/* Buyer Table */}
          {loading ? (
            <div className="buyer-loading">
              <div className="spinner-border" role="status" style={{ marginBottom: '10px' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              Loading buyer data...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'red', fontSize: '16px' }}>{error}</div>
          ) : buyers.length > 0 ? (
            <div className="buyer-table-outer">
              <table className="buyer-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Payment Type</th>
                    <th>Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((buyer, idx) => (
                    <tr key={buyer.id || idx}>
                      <td><strong>{buyer.name}</strong></td>
                      <td>{buyer.date}</td>
                      <td style={{ fontWeight: '600', color: '#28a745' }}>₹{buyer.amount}</td>
                      <td>{buyer.notes || '-'}</td>
                      <td>
                        <span className={`payment-badge ${buyer.payment_type.toLowerCase()}`}>
                          {buyer.payment_type}
                        </span>
                      </td>
                      <td>{buyer.bank || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="buyer-empty">
              <i className="fas fa-users"></i>
              No buyer transactions found. Click "New Buyer" to add your first transaction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Buyer; 