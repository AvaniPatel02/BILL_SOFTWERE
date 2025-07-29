import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Buyer.css";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getBuyers, addBuyer, addBuyerName } from '../../services/buyerApi';
import { useEffect } from 'react';

const Buyer = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', amount: '', notes: '', paymentType: 'Bank' });
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get token from localStorage (adjust if you use a different auth system)
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    async function fetchBuyers() {
      setLoading(true);
      setError('');
      try {
        const data = await getBuyers(token);
        setBuyers(data);
      } catch (err) {
        setError('Failed to fetch buyers');
      }
      setLoading(false);
    }
    if (token) fetchBuyers();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    try {
      const payload = {
        name: form.name,
        date: form.date || new Date().toISOString().split('T')[0],
        amount: Number(form.amount) || 0,
        notes: form.notes || '',
        payment_type: form.paymentType || 'Cash'
      };
      const newBuyer = await addBuyerName(payload);
      setBuyers(prev => [...prev, newBuyer]);
      setShowModal(false);
      setForm({ name: '', date: '', amount: '', notes: '', paymentType: 'Bank' });
    } catch (err) {
      setError('Failed to save buyer');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="buyer-container">
          <div className="buyer-header-group">
            <button className="buyer-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h2 className="buyer-title">Buyer Page</h2>
            <button className="buyer-newbill-btn" onClick={() => setShowModal(true)}>New Buyer</button>
          </div>
          {showModal && (
            <div className="buyer-modal-overlay">
              <div className="buyer-modal">
                <h3>New Buyer</h3>
                <label>Name
                  <input type="text" name="name" value={form.name} onChange={handleChange} />
                </label>
                <label>Date
                  <input type="date" name="date" value={form.date} onChange={handleChange} />
                </label>
                <label>Amount
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} />
                </label>
                <label>Notes
                  <textarea name="notes" value={form.notes} onChange={handleChange} />
                </label>
                <label>Payment Type
                  <select name="paymentType" value={form.paymentType} onChange={handleChange}>
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </label>
                <div className="buyer-modal-btns">
                  <button className="buyer-modal-save" onClick={handleSave}>Save</button>
                  <button className="buyer-modal-cancel" onClick={handleCancel}>Cancel</button>
                </div>
                {error && <div className="buyer-error">{error}</div>}
              </div>
            </div>
          )}
          {/* Add Buyer details or functionality here */}
          {loading ? (
            <div className="buyer-loading">Loading...</div>
          ) : error ? (
            <div className="buyer-error">{error}</div>
          ) : buyers.length > 0 && (
            <div className="buyer-table-outer">
              <div className="buyer-table-container">
                <table className="buyer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Notes</th>
                      <th>Payment Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((buyer, idx) => (
                      <tr key={buyer.id || idx}>
                        <td>{buyer.name}</td>
                        <td>{buyer.date}</td>
                        <td>{buyer.amount}</td>
                        <td>{buyer.notes}</td>
                        <td>{buyer.payment_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Buyer; 