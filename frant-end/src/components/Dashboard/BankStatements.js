import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchBanks, fetchCashEntries } from '../../services/bankCashApi';
import { fetchBankCashTransactions } from '../../services/bankingApi';
import {
  updateCompanyBill,
  updateSalary,
  updateOtherTransaction,
  deleteCompanyBill,
  deleteSalary,
  deleteOtherTransaction
} from '../../services/bankingApi';
import { addBuyer, updateBuyer, deleteBuyer } from '../../services/buyerApi';
import '../../styles/BankStatements.css';
import BankStatementPDF from './BankStatementPDF';

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Handles both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss' formats
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}-${m}-${y}`;
}

const BankStatements = () => {
  const [mode, setMode] = useState('All'); // 'Bank', 'Cash', 'All'
  const [banks, setBanks] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editTx, setEditTx] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const navigate = useNavigate();
  const tableRef = useRef();
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchBanks().then(setBanks);
    fetchCashEntries().then(setCashEntries);
  }, []);

  // Fetch transactions when mode or selectedBank changes
  useEffect(() => {
    setError("");
    setLoading(true);
    let fetchParams = {};

    if (mode === 'Bank') {
      if (selectedBank) {
        fetchParams = { type: 'bank', name: selectedBank };
      } else {
        fetchParams = { type: 'bank' }; // No name param means all banks
      }
    } else if (mode === 'Cash') {
      fetchParams = { type: 'cash' };
    } else {
      fetchParams = { type: 'all' };
    }

    fetchBankCashTransactions(fetchParams)
      .then(setTransactions)
      .catch(() => setError("Failed to fetch transactions"))
      .finally(() => setLoading(false));
  }, [mode, selectedBank]);

  // Find the actual opening balance transaction from the API
  const openingBalance = transactions.find(tx => tx.type === 'OpeningBalance');

  let totalCredit = 0, totalDebit = 0;
  let filtered = transactions;
  if (fromDate) filtered = filtered.filter(tx => tx.date && tx.date >= fromDate);
  if (toDate) filtered = filtered.filter(tx => tx.date && tx.date <= toDate);
  filtered.forEach(tx => {
    if (tx.credit) totalCredit += Number(tx.amount);
    if (tx.debit) totalDebit += Number(tx.amount);
  });

  async function handleGeneratePDF() {
    try {
      setDownloadingPDF(true);

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.zIndex = '-1';
      document.body.appendChild(tempDiv);

      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <BankStatementPDF
          transactions={transactions}
          mode={mode}
          selectedBank={selectedBank}
          fromDate={fromDate}
          toDate={toDate}
          onDownloadComplete={() => {
            setDownloadingPDF(false);
            document.body.removeChild(tempDiv);
            root.unmount();
          }}
        />
      );
    } catch (error) {
      alert('Failed to generate PDF: ' + error.message);
      setDownloadingPDF(false);
    }
  }

  function renderTransactionsTable(transactions) {
    if (transactions.length === 0) return <div className="alert alert-info">No transactions found.</div>;

    // Separate opening balance from other transactions
    const openingTx = transactions.find(tx => tx.type === 'OpeningBalance');
    const otherTransactions = transactions.filter(tx => tx.type !== 'OpeningBalance');

    // Sort other transactions by date ascending (oldest first)
    const sortedTransactions = otherTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    // Calculate opening balance as of the day before 'fromDate'
    let calculatedOpeningBalance = openingTx ? Number(openingTx.amount) : 0;
    let openingBalanceDate = openingTx ? openingTx.date : null;
    if (fromDate && openingTx) {
      // Sum all credits and debits up to (but not including) fromDate
      sortedTransactions.forEach(tx => {
        if (tx.date < fromDate) {
          if (tx.credit) calculatedOpeningBalance += Number(tx.amount);
          if (tx.debit) calculatedOpeningBalance -= Number(tx.amount);
        }
      });
    }

    // Filter transactions for the table: from 'fromDate' onward
    let filteredTransactions = sortedTransactions;
    if (fromDate) {
      filteredTransactions = filteredTransactions.filter(tx => tx.date >= fromDate);
    }
    if (toDate) {
      filteredTransactions = filteredTransactions.filter(tx => tx.date <= toDate);
    }

    // Calculate totals for the visible table
    let totalCredit = 0, totalDebit = 0;
    filteredTransactions.forEach(tx => {
      if (tx.credit) totalCredit += Number(tx.amount);
      if (tx.debit) totalDebit += Number(tx.amount);
    });

    const getDetails = (tx) => tx.details || '-';

    return (
      <div className="bankstatements-table-responsive" ref={tableRef}>
        {((mode === 'Bank' && selectedBank) || mode === 'Cash') && openingTx && (
          <div className="bankstatements-opening-balance">
            Opening Balance: <strong>{calculatedOpeningBalance.toFixed(2)}</strong>
            {fromDate && (
              <> (as of {(() => {
                const d = new Date(fromDate);
                d.setDate(d.getDate() - 1);
                return formatDate(d.toISOString().split('T')[0]);
              })()})</>
            )}
          </div>
        )}
        <table className="bankstatements-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Description</th>
              <th>Credit</th>
              <th>Debit</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let runningBalance = calculatedOpeningBalance;
              return filteredTransactions.map((tx, idx) => {
                const credit = tx.credit ? Number(tx.amount) : 0;
                const debit = tx.debit ? Number(tx.amount) : 0;
                runningBalance = runningBalance + credit - debit;
                return (
                  <tr key={idx}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{getDetails(tx)}</td>
                    <td>{tx.description || '-'}</td>
                    <td>{credit ? credit.toFixed(2) : '-'}</td>
                    <td>{debit ? debit.toFixed(2) : '-'}</td>
                    <td>{runningBalance.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => {
                          setEditingIdx(idx);
                          setEditTx({
                            date: tx.date || '',
                            amount: tx.amount || '',
                            description: tx.description || ''
                          });
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this transaction?')) {
                            handleDelete(tx, idx);
                          }
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              });
            })()}
            {/* Total Row */}
            <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
              <td colSpan={3} style={{ textAlign: 'right' }}>Total</td>
              <td>{totalCredit.toFixed(2)}</td>
              <td>{totalDebit.toFixed(2)}</td>
              <td>{(calculatedOpeningBalance + totalCredit - totalDebit).toFixed(2)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  async function saveEdit(tx, idx) {
    let updateFn;
    let id = tx.id;
    let data = {};





    // Map the form fields to the correct database fields based on transaction type
    if (tx.type === 'CompanyBill') {
      data = {
        date: editTx.date,
        amount: editTx.amount,
        notice: editTx.description,  // Map description to notice field
        company: tx.details,  // Keep the original company name
        payment_type: tx.payment_type || 'Bank',  // Add payment_type
        bank: tx.bank || ''  // Add bank field
      };
      updateFn = updateCompanyBill;
    } else if (tx.type === 'Buyer') {
      data = {
        date: editTx.date,
        amount: editTx.amount,
        notes: editTx.description,  // Map description to notes field
        name: tx.details,  // Keep the original buyer name
        payment_type: tx.payment_type || 'Bank',  // Add payment_type
        bank: tx.bank || ''  // Add bank field
      };
      updateFn = updateBuyer;  // Use the Buyer API instead of blocking
    } else if (tx.type === 'Salary') {
      data = {
        date: editTx.date,
        amount: editTx.amount,
        notice: editTx.description,  // Map description to notice field
        name: tx.details,  // Keep the original employee name
        payment_type: tx.payment_type || 'Bank',  // Add payment_type
        bank: tx.bank || ''  // Add bank field
      };
      updateFn = updateSalary;
    } else if (tx.type === 'Other') {
      data = {
        date: editTx.date,
        amount: editTx.amount,
        notice: editTx.description,  // Map description to notice field
        name: tx.details,  // Keep the original name (from details field)
        type: tx.description,  // Keep the original type (from description field)
        payment_type: tx.payment_type || 'Bank',  // Add payment_type
        bank: tx.bank || '',  // Add bank field
        transaction_type: tx.transaction_type || 'debit'  // Add transaction_type
      };
      updateFn = updateOtherTransaction;
    } else if (tx.type === 'OpeningBalance') {
      // OpeningBalance transactions cannot be edited
      alert('Opening Balance transactions cannot be edited.');
      return;
    }

    // Check if updateFn was assigned
    if (!updateFn) {
      console.error('No update function assigned for transaction type:', tx.type);
      alert('Cannot update this type of transaction. Type: ' + tx.type);
      return;
    }

    try {
      await updateFn(id, data);
      setEditingIdx(null);
      setEditTx({});
      // Refresh the transactions list to get updated data
      setLoading(true);
      let fetchParams = {};
      if (mode === 'Bank') {
        if (selectedBank) {
          fetchParams = { type: 'bank', name: selectedBank };
        } else {
          fetchParams = { type: 'bank' };
        }
      } else if (mode === 'Cash') {
        fetchParams = { type: 'cash' };
      } else {
        fetchParams = { type: 'all' };
      }
      const updatedTransactions = await fetchBankCashTransactions(fetchParams);
      setTransactions(updatedTransactions);
      setLoading(false);
      alert('Transaction updated successfully!');
    } catch (err) {
      alert('Failed to update transaction: ' + (err.message || 'Unknown error'));
      console.error('Update error:', err);
    }
  }

  async function handleDelete(tx, idx) {
    let deleteFn;
    let id = tx.id;

    if (tx.type === 'CompanyBill') deleteFn = deleteCompanyBill;
    else if (tx.type === 'Buyer') deleteFn = deleteBuyer;
    else if (tx.type === 'Salary') deleteFn = deleteSalary;
    else if (tx.type === 'Other') deleteFn = deleteOtherTransaction;
    else if (tx.type === 'OpeningBalance') {
      alert('Opening Balance transactions cannot be deleted.');
      return;
    }

    // Check if deleteFn was assigned
    if (!deleteFn) {
      console.error('No delete function assigned for transaction type:', tx.type);
      alert('Cannot delete this type of transaction. Type: ' + tx.type);
      return;
    }

    try {
      await deleteFn(id);
      // Refresh the transactions list to get updated data
      setLoading(true);
      let fetchParams = {};
      if (mode === 'Bank') {
        if (selectedBank) {
          fetchParams = { type: 'bank', name: selectedBank };
        } else {
          fetchParams = { type: 'bank' };
        }
      } else if (mode === 'Cash') {
        fetchParams = { type: 'cash' };
      } else {
        fetchParams = { type: 'all' };
      }
      const updatedTransactions = await fetchBankCashTransactions(fetchParams);
      setTransactions(updatedTransactions);
      setLoading(false);
      alert('Transaction deleted successfully!');
    } catch (err) {
      alert('Failed to delete transaction: ' + (err.message || 'Unknown error'));
      console.error('Delete error:', err);
    }
  }


  return (
    <div className="bankstatements-layout">
      <Header />
      <div className="bankstatements-content">
        <Sidebar />
        <div className="bankstatements-container">
          <div className="bankstatements-header-group">
            <button className="bankstatements-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h1 className="bankstatements-title">Bank & Cash Statements</h1>
          </div>
          <div className="bankstatements-controls">
            <div className="d-flex align-items-center mb-3">
              <label className="me-2">From:</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-control me-3" style={{ width: 180 }} />
              <label className="me-2">To:</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-control me-3" style={{ width: 180 }} />
              <label className="me-2">View:</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className="form-select" style={{ width: 180, height: 40 }}>
                <option value="All">All</option>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
              {mode === 'Bank' && (
                <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} className="form-select ms-3" style={{ width: 220 ,height: 40}}>
                  <option value="">-- All Banks --</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.bank_name}>{bank.bank_name} ({bank.account_number})</option>
                  ))}
                </select>
              )}
            </div>
            <button className="bankstatements-generatepdf-btn" onClick={handleGeneratePDF} disabled={downloadingPDF}>
              {downloadingPDF ? <span className="bankstatements-spinner" /> : 'Generate PDF'}
            </button>
          </div>
          <div className="bankstatements-table-section">
            {/* Heading inside container, above opening balance and table */}
            {mode === 'Bank' && selectedBank && (
              <h2 className="bankstatements-table-heading">Transactions for {selectedBank}</h2>
            )}
            {mode === 'Cash' && (
              <h2 className="bankstatements-table-heading">Cash Transactions</h2>
            )}
            {mode === 'All' && (
              <h2 className="bankstatements-table-heading">All Bank & Cash Entries</h2>
            )}
            {/* Table and opening balance */}
            {mode === 'Bank' && selectedBank && (loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions))}
            {mode === 'Cash' && (loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions))}
            {mode === 'All' && (loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions))}
            
            {/* Edit Modal */}
            {editingIdx !== null && (
              <div className="modal show">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Edit Transaction</h5>
                      <button type="button" className="btn-close" onClick={() => setEditingIdx(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Transaction Type</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={transactions[editingIdx]?.type || ''} 
                          disabled
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={editTx.date || ''} 
                          onChange={e => setEditTx({...editTx, date: e.target.value})}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-control" 
                          value={editTx.amount || ''} 
                          onChange={e => setEditTx({...editTx, amount: e.target.value})}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editTx.description || ''} 
                          onChange={e => setEditTx({...editTx, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingIdx(null)}>Cancel</button>
                      <button type="button" className="btn btn-primary" onClick={() => {
                        const currentTx = transactions[editingIdx];
                        saveEdit(currentTx, editingIdx);
                      }}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankStatements;