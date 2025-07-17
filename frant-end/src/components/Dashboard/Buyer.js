import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Buyer.css";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Buyer = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', amount: '', notes: '', paymentType: 'Bank' });
  const [bills, setBills] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setBills(prev => [...prev, form]);
    setShowModal(false);
    setForm({ name: '', date: '', amount: '', notes: '', paymentType: 'Bank' });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="buyer-content">
          <div className="buyer-header-group">
            <button className="buyer-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h2>Buyer Page</h2>
          </div>
          <button className="buyer-newbill-btn" onClick={() => setShowModal(true)}>New Bill</button>
          {showModal && (
            <div className="buyer-modal-overlay">
              <div className="buyer-modal">
                <h3>New Bill</h3>
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
              </div>
            </div>
          )}
          {/* Add Buyer details or functionality here */}
          {bills.length > 0 && (
            <div className="buyer-table-outer">
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
                  {bills.map((bill, idx) => (
                    <tr key={idx}>
                      <td>{bill.name}</td>
                      <td>{bill.date}</td>
                      <td>{bill.amount}</td>
                      <td>{bill.notes}</td>
                      <td>{bill.paymentType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Buyer; 