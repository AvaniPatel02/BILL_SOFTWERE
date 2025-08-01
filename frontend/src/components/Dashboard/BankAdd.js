import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import "../../styles/BankAdd.css";
import Modal from "react-modal";
import {
  fetchBanks,
  addBank,
  updateBank,
  deleteBank,
  fetchDeletedBanks,
  restoreBank,
  fetchCashEntries,
  addCashEntry,
  updateCashEntry,
  deleteCashEntry,
  fetchDeletedCashEntries,
  restoreCashEntry,
  permanentDeleteBank,
  permanentDeleteCashEntry,
  calculateBankTotals,
  calculateCashTotals,
} from "../../services/bankCashApi";

function formatDate(date) {
  if (!date) return "-";
  return date; // Already formatted by backend
}

Modal.setAppElement("#root"); // for accessibility

const BankAdd = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
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
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null); // {type: 'bank'|'cash', id}
  const [bankTotals, setBankTotals] = useState({});
  const [cashTotals, setCashTotals] = useState({});

  // Fetch all data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBanks(),
      fetchCashEntries(),
      fetchDeletedBanks(),
      fetchDeletedCashEntries(),
    ])
      .then(([banksData, cashData, deletedBanksData, deletedCashData]) => {
        setBanks(banksData);
        setCashEntries(cashData);
        setDeletedBanks(deletedBanksData);
        setDeletedCashEntries(deletedCashData);
      })
      .catch(() => setError("Failed to fetch data"))
      .finally(() => setLoading(false));
  }, []);

  // Add after the initial data fetching useEffect
  useEffect(() => {
    const fetchBankTotals = async () => {
      const totals = {};
      for (const bank of banks) {
        try {
          const result = await calculateBankTotals(bank.bank_name);
          totals[bank.id] = result;
        } catch (e) {
          totals[bank.id] = { netAmount: '0.00' };
        }
      }
      setBankTotals(totals);
    };
    if (banks.length > 0) fetchBankTotals();
  }, [banks]);

  useEffect(() => {
    const fetchCashTotals = async () => {
      try {
        const result = await calculateCashTotals();
        setCashTotals(result);
      } catch (e) {
        setCashTotals({ netAmount: '0.00' });
      }
    };
    fetchCashTotals();
  }, [cashEntries]);

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
    setError("");
    if (formData.account_number !== formData.confirm_account_number) {
      setError("Account numbers do not match");
      setLoading(false);
      return;
    }
    const payload = {
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      amount: formData.amount,
    };
    const apiCall = editingBank
      ? updateBank(editingBank.id, payload)
      : addBank(payload);

    apiCall
      .then(() => fetchBanks().then(setBanks))
      .catch(() => setError("Failed to save bank"))
      .finally(() => {
        resetForm();
        setShowBankModal(false);
        setLoading(false);
      });
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
  // Soft delete bank (backend)
  const handleDeleteBank = (id) => {
    setLoading(true);
    deleteBank(id)
      .then(() => {
        fetchBanks().then(setBanks);
        fetchDeletedBanks().then(setDeletedBanks);
      })
      .catch(() => setError("Failed to delete bank"))
      .finally(() => setLoading(false));
  };
  // Restore bank (backend)
  const handleRestoreBank = (id) => {
    setLoading(true);
    restoreBank(id)
      .then(() => {
        fetchBanks().then(setBanks);
        fetchDeletedBanks().then(setDeletedBanks);
      })
      .catch(() => setError("Failed to restore bank"))
      .finally(() => setLoading(false));
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
    setError("");
    if (!cashFormData.date) {
      setError("Date is required");
      setLoading(false);
      return;
    }
    const payload = {
      amount: cashFormData.amount,
      date: cashFormData.date,
      description: cashFormData.description,
    };
    const apiCall = editingCashEntry
      ? updateCashEntry(editingCashEntry.id, payload)
      : addCashEntry(payload);

    apiCall
      .then(() => fetchCashEntries().then(setCashEntries))
      .catch(() => setError("Failed to save cash entry"))
      .finally(() => {
        resetCashForm();
        setShowCashModal(false);
        setLoading(false);
      });
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
  // Soft delete cash entry (backend)
  const handleDeleteCashEntry = (id) => {
    setLoading(true);
    deleteCashEntry(id)
      .then(() => {
        fetchCashEntries().then(setCashEntries);
        fetchDeletedCashEntries().then(setDeletedCashEntries);
      })
      .catch(() => setError("Failed to delete cash entry"))
      .finally(() => setLoading(false));
  };
  // Restore cash entry (backend)
  const handleRestoreCashEntry = (id) => {
    setLoading(true);
    restoreCashEntry(id)
      .then(() => {
        fetchCashEntries().then(setCashEntries);
        fetchDeletedCashEntries().then(setDeletedCashEntries);
      })
      .catch(() => setError("Failed to restore cash entry"))
      .finally(() => setLoading(false));
  };

  // Modal open/close handlers
  const closeCashModal = () => { resetCashForm(); setShowCashModal(false); };
  const openDeleteModal = (type, id) => { setDeleteTarget({ type, id }); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setDeleteTarget(null); setShowDeleteModal(false); };
  const openRecycleModal = () => setShowRecycleModal(true);
  const closeRecycleModal = () => setShowRecycleModal(false);

  // Soft delete logic (calls backend)
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setLoading(true);
    if (deleteTarget.type === 'bank') {
      deleteBank(deleteTarget.id)
        .then(() => {
          fetchBanks().then(setBanks);
          fetchDeletedBanks().then(setDeletedBanks);
        })
        .catch(() => setError("Failed to delete bank"))
        .finally(() => {
          closeDeleteModal();
          setLoading(false);
        });
    } else if (deleteTarget.type === 'cash') {
      deleteCashEntry(deleteTarget.id)
        .then(() => {
          fetchCashEntries().then(setCashEntries);
          fetchDeletedCashEntries().then(setDeletedCashEntries);
        })
        .catch(() => setError("Failed to delete cash entry"))
        .finally(() => {
          closeDeleteModal();
          setLoading(false);
        });
    }
  };

  // Permanent delete handlers (with confirmation modal)
  const handlePermanentDeleteBank = (id) => {
    setPermanentDeleteTarget({ type: 'bank', id });
    setShowPermanentDeleteModal(true);
  };
  const handlePermanentDeleteCash = (id) => {
    setPermanentDeleteTarget({ type: 'cash', id });
    setShowPermanentDeleteModal(true);
  };
  const confirmPermanentDelete = () => {
    if (!permanentDeleteTarget) return;
    setLoading(true);
    if (permanentDeleteTarget.type === 'bank') {
      permanentDeleteBank(permanentDeleteTarget.id)
        .then(() => fetchDeletedBanks().then(setDeletedBanks))
        .catch(() => setError("Failed to permanently delete bank"))
        .finally(() => {
          setShowPermanentDeleteModal(false);
          setPermanentDeleteTarget(null);
          setLoading(false);
        });
    } else if (permanentDeleteTarget.type === 'cash') {
      permanentDeleteCashEntry(permanentDeleteTarget.id)
        .then(() => fetchDeletedCashEntries().then(setDeletedCashEntries))
        .catch(() => setError("Failed to permanently delete cash entry"))
        .finally(() => {
          setShowPermanentDeleteModal(false);
          setPermanentDeleteTarget(null);
          setLoading(false);
        });
    }
  };
  const cancelPermanentDelete = () => {
    setShowPermanentDeleteModal(false);
    setPermanentDeleteTarget(null);
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
                <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/bank-statements')}>
                  Statements
                </button>
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
                        <td className="text-center fw-bold">{
                          (() => {
                            const totals = bankTotals[bank.id] || { netAmount: '0.00' };
                            const baseAmount = parseFloat(bank.amount) || 0;
                            const netTransactions = parseFloat(totals.netAmount) || 0;
                            return (baseAmount + netTransactions).toFixed(2);
                          })()
                        }</td>
                        <td className="text-center">
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
                        <td className="text-center fw-bold">{
                          (() => {
                            const totals = cashTotals || { netAmount: '0.00' };
                            const baseAmount = parseFloat(entry.amount) || 0;
                            const netTransactions = parseFloat(totals.netAmount) || 0;
                            return (baseAmount + netTransactions).toFixed(2);
                          })()
                        }</td>
                        <td className="text-center">
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
            {/* Permanent Delete Confirmation Modal */}
            <Modal
              isOpen={showPermanentDeleteModal}
              onRequestClose={cancelPermanentDelete}
              contentLabel="Permanent Delete Confirmation"
              className="modal-content-custom"
              overlayClassName="modal-overlay-custom"
            >
              <h5>Are you sure you want to permanently delete this entry?</h5>
              <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-secondary me-2" onClick={cancelPermanentDelete} disabled={loading}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmPermanentDelete} disabled={loading}>OK</button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAdd; 