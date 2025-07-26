import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchBanks, fetchCashEntries } from '../../services/bankCashApi';
import { fetchBankCashTransactions } from '../../services/bankingApi';
import {
  updateCompanyBill,
  updateBuyerBill,
  updateSalary,
  updateOtherTransaction
} from '../../services/bankingApi';

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

  function renderTransactionsTable(transactions) {
    if (transactions.length === 0) return <div className="alert alert-info">No transactions found.</div>;

    // Sort transactions by date ascending (oldest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
      // Parse as YYYY-MM-DD
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    // Filter by fromDate and toDate
    const filteredTransactions = sortedTransactions.filter(tx => {
      if (!fromDate && !toDate) return true;
      const txDate = new Date(tx.date);
      if (fromDate && txDate < new Date(fromDate)) return false;
      if (toDate && txDate > new Date(toDate)) return false;
      return true;
    });

    // Debug: log a sample transaction to inspect field names
    if (filteredTransactions.length > 0) {
      console.log('Sample transaction:', filteredTransactions[0]);
    }

    // Calculate totals
    let totalCredit = 0, totalDebit = 0, totalAmount = 0;

    // Robust helper to get source
    const getSource = (tx) => {
      // Try to detect cash entry by type or by missing bank_name
      if (
        (tx.type && tx.type.toLowerCase() === 'cash') ||
        (!tx.bank_name && !tx.bank && (!tx.type || tx.type.toLowerCase() !== 'bank'))
      ) return 'Cash';
      return tx.bank_name || tx.bank || '-';
    };

    // Robust helper to get details
    const getDetails = (tx) => tx.details || '-';

    return (
      <div className="table-responsive">
        <table className="statement-table">
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
            {filteredTransactions.map((tx, idx) => {
              const credit = tx.credit ? Number(tx.amount) : 0;
              const debit = tx.debit ? Number(tx.amount) : 0;
              const amount = Number(tx.amount);

              totalCredit += credit;
              totalDebit += debit;
              totalAmount += amount;

              return (
                <tr key={idx}>
                  <td>
                    {editingIdx === idx
                      ? <input value={editTx.date || ''} onChange={e => setEditTx({...editTx, date: e.target.value})} />
                      : formatDate(tx.date)}
                  </td>
                  <td>{getDetails(tx)}</td>
                  <td>
                    {editingIdx === idx
                      ? <input value={editTx.description || ''} onChange={e => setEditTx({...editTx, description: e.target.value})} />
                      : (tx.description || '-')}
                  </td>
                  <td>{credit ? credit.toFixed(2) : '-'}</td>
                  <td>{debit ? debit.toFixed(2) : '-'}</td>
                  <td>{amount.toFixed(2)}</td>
                  <td>
                     {/* Action column intentionally left empty (Edit removed) */}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            {mode !== 'All' && (
              <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                <td colSpan={3} style={{ textAlign: 'right' }}>Total</td>
                <td>{totalCredit.toFixed(2)}</td>
                <td>{totalDebit.toFixed(2)}</td>
                <td>{(totalCredit - totalDebit).toFixed(2)}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  async function saveEdit(tx, idx) {
    let updateFn;
    let id = tx.id;
    let data = {
      date: editTx.date,
      amount: editTx.amount,
      description: editTx.description,
      // Add other fields as needed
    };

    if (tx.type === 'CompanyBill') updateFn = updateCompanyBill;
    else if (tx.type === 'BuyerBill') updateFn = updateBuyerBill;
    else if (tx.type === 'Salary') updateFn = updateSalary;
    else if (tx.type === 'Other') updateFn = updateOtherTransaction;

    try {
      await updateFn(id, data);
      setEditingIdx(null);
      setEditTx({});
      setTransactions(prev =>
        prev.map((item, i) => (i === idx ? { ...item, ...editTx } : item))
      );
    } catch (err) {
      alert('Failed to update transaction');
    }
  }

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container">
          <div className="personbill-header-group">
            <button className="personbill-back-btn" onClick={() => navigate(-1)}>Back</button>
            <h1 className="personbill-title">Bank & Cash Statements</h1>
          </div>
          <div className="container mt-4">
            <div className="d-flex align-items-center mb-3">
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
            {/* Date range filter */}
            <div className="d-flex align-items-center mb-3">
              <label className="me-2">From Date:</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-control me-3" style={{ width: 180 }} />
              <label className="me-2">To Date:</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-control" style={{ width: 180 }} />
            </div>
            {/* Placeholder for statements display */}
            {mode === 'Bank' && selectedBank && (
              <div>
                <h3>Transactions for {selectedBank}</h3>
                {loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions)}
              </div>
            )}
            {mode === 'Cash' && (
              <div>
                <h3>Total Cash: {cashEntries.reduce((sum, entry) => sum + Number(entry.amount), 0).toFixed(2)}</h3>
                {loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions)}
              </div>
            )}
            {mode === 'All' && (
              <div>
                <h3>All Bank & Cash Entries</h3>
                {loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : renderTransactionsTable(transactions)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankStatements; 