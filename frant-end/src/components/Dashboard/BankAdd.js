import React, { useState, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import "../../styles/BankAdd.css";
import Modal from "react-modal";

const initialBanks = [
  { id: 1, bank_name: "SBI", account_number: "1234567890", amount: 5000 },
  { id: 2, bank_name: "HDFC", account_number: "9876543210", amount: 12000 },
];
const initialCashEntries = [
  { id: 1, amount: 2000, date: "2024-07-01", description: "Office petty cash" },
  { id: 2, amount: 1500, date: "2024-07-10", description: "Snacks" },
];

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

Modal.setAppElement("#root"); // for accessibility

const BankAdd = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState(initialBanks);
  const [cashEntries, setCashEntries] = useState(initialCashEntries);
  const [deletedBanks, setDeletedBanks] = useState([]);
  const [deletedCashEntries, setDeletedCashEntries] = useState([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type: 'bank'|'cash', id}
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [editingCashEntry, setEditingCashEntry] = useState(null);
  const [formData, setFormData] = useState({ bank_name: "", account_number: "", confirm_account_number: "", amount: "" });
  const [cashFormData, setCashFormData] = useState({ amount: "", date: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handlers for Bank
  const resetForm = () => {
    setFormData({ bank_name: "", account_number: "", confirm_account_number: "", amount: "" });
    setEditingBank(null);
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (formData.account_number !== formData.confirm_account_number) {
        setError("Account numbers do not match");
        setLoading(false);
        return;
      }
      if (editingBank) {
        setBanks(banks.map((b) => (b.id === editingBank.id ? { ...editingBank, ...formData, amount: Number(formData.amount) } : b)));
        setShowBankModal(false);
      } else {
        setBanks([...banks, { ...formData, id: Date.now(), amount: Number(formData.amount) }]);
      }
      resetForm();
      setLoading(false);
    }, 500);
  };
  // Open modal for new bank (blank form)
  const openBankModal = () => {
    setEditingBank(null);
    setFormData({ bank_name: "", account_number: "", confirm_account_number: "", amount: "" });
    setShowBankModal(true);
  };
  // Open modal for editing bank (pre-filled form)
  const handleEditBank = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      confirm_account_number: bank.account_number,
      amount: bank.amount,
    });
    setShowBankModal(true);
  };
  const handleDeleteBank = (id) => {
    const bank = banks.find((b) => b.id === id);
    setBanks(banks.filter((b) => b.id !== id));
    setDeletedBanks([...deletedBanks, bank]);
  };
  const handleRestoreBank = (id) => {
    const bank = deletedBanks.find((b) => b.id === id);
    setDeletedBanks(deletedBanks.filter((b) => b.id !== id));
    setBanks([...banks, bank]);
  };

  // Close modal for bank (reset form)
  const closeBankModal = () => {
    setEditingBank(null);
    setFormData({ bank_name: "", account_number: "", confirm_account_number: "", amount: "" });
    setShowBankModal(false);
  };

  // Handlers for Cash
  const resetCashForm = () => {
    setCashFormData({ amount: "", date: "", description: "" });
    setEditingCashEntry(null);
  };
  const handleCashChange = (e) => {
    setCashFormData({ ...cashFormData, [e.target.name]: e.target.value });
  };
  const handleCashSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (editingCashEntry) {
        setCashEntries(cashEntries.map((c) => (c.id === editingCashEntry.id ? { ...editingCashEntry, ...cashFormData, amount: Number(cashFormData.amount) } : c)));
        setShowCashModal(false);
      } else {
        setCashEntries([...cashEntries, { ...cashFormData, id: Date.now(), amount: Number(cashFormData.amount) }]);
      }
      resetCashForm();
      setLoading(false);
    }, 500);
  };
  // Open modal for new cash entry (blank form)
  const openCashModal = () => {
    setEditingCashEntry(null);
    setCashFormData({ amount: "", date: "", description: "" });
    setShowCashModal(true);
  };
  // Open modal for editing cash entry (pre-filled form)
  const handleEditCashEntry = (entry) => {
    setEditingCashEntry(entry);
    setCashFormData({
      amount: entry.amount,
      date: entry.date,
      description: entry.description,
    });
    setShowCashModal(true);
  };
  const handleDeleteCashEntry = (id) => {
    const entry = cashEntries.find((c) => c.id === id);
    setCashEntries(cashEntries.filter((c) => c.id !== id));
    setDeletedCashEntries([...deletedCashEntries, entry]);
  };
  const handleRestoreCashEntry = (id) => {
    const entry = deletedCashEntries.find((c) => c.id === id);
    setDeletedCashEntries(deletedCashEntries.filter((c) => c.id !== id));
    setCashEntries([...cashEntries, entry]);
  };

  // Modal open/close handlers
  const closeCashModal = () => { resetCashForm(); setShowCashModal(false); };
  const openDeleteModal = (type, id) => { setDeleteTarget({ type, id }); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setDeleteTarget(null); setShowDeleteModal(false); };
  const openRecycleModal = () => setShowRecycleModal(true);
  const closeRecycleModal = () => setShowRecycleModal(false);

  // Soft delete logic
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'bank') {
      const bank = banks.find((b) => b.id === deleteTarget.id);
      setBanks(banks.filter((b) => b.id !== deleteTarget.id));
      setDeletedBanks([...deletedBanks, bank]);
    } else if (deleteTarget.type === 'cash') {
      const entry = cashEntries.find((c) => c.id === deleteTarget.id);
      setCashEntries(cashEntries.filter((c) => c.id !== deleteTarget.id));
      setDeletedCashEntries([...deletedCashEntries, entry]);
    }
    closeDeleteModal();
  };

  // Permanent delete handlers
  const handlePermanentDeleteBank = (id) => {
    setDeletedBanks(deletedBanks.filter((b) => b.id !== id));
  };
  const handlePermanentDeleteCash = (id) => {
    setDeletedCashEntries(deletedCashEntries.filter((c) => c.id !== id));
  };

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
      <Sidebar />
        <div className="container">
          <div className="personbill-header-group">
            <button className="personbill-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h1 className="personbill-title">Bank & Cash Management</h1>
          </div>
          <div className="container mt-4 bankadd-main-container">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2>Bank & Cash Management</h2>
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={openRecycleModal}>
                  Recycle Entries
                </button>
                <button
                  className="new-bill-btn me-2"
                  onClick={openCashModal}
                  disabled={loading}
                >
                  Add Cash Entry
                </button>
                <button
                  className="new-bill-btn me-2"
                  onClick={openBankModal}
                  disabled={loading}
                >
                  Add Bank
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
              </div>
            )}

            {/* Bank Table */}
            <div className="mb-4">
              <h3>Bank Accounts</h3>
              <div className="table-responsive">
                <table className="statement-table ">
                  <thead>
                    <tr>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((bank) => (
                      <tr key={bank.id}>
                        <td className="text-center">{bank.bank_name}</td>
                        <td className="text-center">{bank.account_number}</td>
                        <td className="text-center">{bank.amount}</td>
                        <td className="text-center">
                          <div className="tooltip-container">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditBank(bank)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <span className="tooltip-text" style={{ top: "20px", left: "60px" }}>Edit</span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="action-btn delete"
                              onClick={() => openDeleteModal('bank', bank.id)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            <span className="tooltip-text" style={{ top: "20px", left: "60px" }}>Delete</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cash Table */}
            <div className="mb-4">
              <h3>Cash Entries</h3>
              <div className="table-responsive">
                <table className="statement-table ">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="text-center">{formatDate(entry.date)}</td>
                        <td className="text-center">{entry.description || "-"}</td>
                        <td className="text-center">{entry.amount}</td>
                        <td className="text-center">
                          <div className="tooltip-container">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditCashEntry(entry)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <span className="tooltip-text" style={{ top: "20px", left: "60px" }}>Edit</span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="action-btn delete"
                              onClick={() => openDeleteModal('cash', entry.id)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            <span className="tooltip-text" style={{ top: "20px", left: "60px" }}>Delete</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add/Edit Cash Modal */}
            <Modal
              isOpen={showCashModal}
              onRequestClose={closeCashModal}
              contentLabel="Add/Edit Cash Entry"
              className="modal-content-custom"
              overlayClassName="modal-overlay-custom"
            >
              <h5>{editingCashEntry ? "Edit Cash Entry" : "Add Cash Entry"}</h5>
              <form onSubmit={handleCashSubmit}>
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    name="amount"
                    value={cashFormData.amount}
                    onChange={handleCashChange}
                    required
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={cashFormData.date}
                    onChange={handleCashChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={cashFormData.description}
                    onChange={handleCashChange}
                    rows="3"
                  />
                </div>
                <button type="submit" className="btn btn-success me-2" style={{ backgroundColor: "#195277" }} disabled={loading}>
                  {editingCashEntry ? "Update" : "Add Cash"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeCashModal} disabled={loading}>
                  Cancel
                </button>
              </form>
            </Modal>

            {/* Add/Edit Bank Modal */}
            <Modal
              isOpen={showBankModal}
              onRequestClose={closeBankModal}
              contentLabel="Add/Edit Bank"
              className="modal-content-custom"
              overlayClassName="modal-overlay-custom"
            >
              <h5>{editingBank ? "Edit Bank" : "Add Bank"}</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="confirm_account_number"
                    value={formData.confirm_account_number}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                  />
                </div>
                <button type="submit" className="btn btn-success me-2" style={{ backgroundColor: "#195277" }} disabled={loading}>
                  {editingBank ? "Update" : "Add Bank"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeBankModal} disabled={loading}>
                  Cancel
                </button>
              </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
              isOpen={showDeleteModal}
              onRequestClose={closeDeleteModal}
              contentLabel="Delete Confirmation"
              className="modal-content-custom"
              overlayClassName="modal-overlay-custom"
            >
              <h5>Are you sure you want to delete this entry?</h5>
              <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-secondary me-2" onClick={closeDeleteModal} disabled={loading}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete} disabled={loading}>Delete</button>
              </div>
            </Modal>

            {/* Recycle/Deleted Entries Modal */}
            <Modal
              isOpen={showRecycleModal}
              onRequestClose={closeRecycleModal}
              contentLabel="Recycle Entries"
              className="modal-content-custom"
              overlayClassName="modal-overlay-custom"
            >
              <h5>Deleted Bank Accounts</h5>
              <div className="table-responsive mb-4">
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedBanks.length === 0 ? (
                      <tr><td colSpan="4" className="text-center">No deleted banks</td></tr>
                    ) : (
                      deletedBanks.map((bank) => (
                        <tr key={bank.id}>
                          <td className="text-center">{bank.bank_name}</td>
                          <td className="text-center">{bank.account_number}</td>
                          <td className="text-center">{bank.amount}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-success me-2" onClick={() => handleRestoreBank(bank.id)} disabled={loading}>Restore</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDeleteBank(bank.id)} disabled={loading}>Permanent Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <h5>Deleted Cash Entries</h5>
              <div className="table-responsive">
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedCashEntries.length === 0 ? (
                      <tr><td colSpan="4" className="text-center">No deleted cash entries</td></tr>
                    ) : (
                      deletedCashEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="text-center">{formatDate(entry.date)}</td>
                          <td className="text-center">{entry.description || "-"}</td>
                          <td className="text-center">{entry.amount}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-success me-2" onClick={() => handleRestoreCashEntry(entry.id)} disabled={loading}>Restore</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDeleteCash(entry.id)} disabled={loading}>Permanent Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-secondary" onClick={closeRecycleModal}>Close</button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAdd; 