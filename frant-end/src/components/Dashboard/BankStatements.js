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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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

  // Calculate opening balance and totals for the selected date range
  const openingBalance = calculateOpeningBalance(transactions, fromDate);

  let totalCredit = 0, totalDebit = 0;
  let filtered = transactions;
  if (fromDate) filtered = filtered.filter(tx => tx.date && tx.date >= fromDate);
  if (toDate) filtered = filtered.filter(tx => tx.date && tx.date <= toDate);
  filtered.forEach(tx => {
    if (tx.credit) totalCredit += Number(tx.amount);
    if (tx.debit) totalDebit += Number(tx.amount);
  });

  function renderTransactionsTable(transactions) {
    let filtered = transactions;
    if (fromDate) filtered = filtered.filter(tx => tx.date && tx.date >= fromDate);
    if (toDate) filtered = filtered.filter(tx => tx.date && tx.date <= toDate);
    if (filtered.length === 0) return <div className="alert alert-info">No transactions found.</div>;

    const parseDate = (d) => new Date(d?.split('T')[0]);
    const sorted = [...filtered].sort((a, b) => parseDate(a.date) - parseDate(b.date));

    // Calculate opening balance for the table - only for Bank or Cash mode and when date is selected
    const tableOpeningBalance = (mode === 'Bank' || mode === 'Cash') && fromDate ? calculateOpeningBalance(transactions, fromDate) : 0;
    const showOpeningBalance = (mode === 'Bank' || mode === 'Cash') && fromDate;

    return (
      <div className="table-responsive">
        <table className="statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Credit</th>
              <th>Debit</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Add opening balance row only for Bank or Cash mode and when date is selected */}
            {showOpeningBalance && (
              <tr style={{ fontWeight: 'bold', background: '#e6f7ff' }}>
                <td>{formatDate(fromDate)}</td>
                <td>Opening Balance</td>
                <td>-</td>
                <td>-</td>
                <td>{tableOpeningBalance.toFixed(2)}</td>
                <td></td>
              </tr>
            )}
            {sorted.map((tx, idx) => {
              const credit = tx.credit ? Number(tx.amount) : 0;
              const debit = tx.debit ? Number(tx.amount) : 0;
              const amount = Number(tx.amount);

              return (
                <tr key={idx}>
                  <td>
                    {editingIdx === idx
                      ? <input value={editTx.date || ''} onChange={e => setEditTx({ ...editTx, date: e.target.value })} />
                      : formatDate(tx.date)}
                  </td>
                  <td>
                    {editingIdx === idx
                      ? <input value={editTx.details || ''} onChange={e => setEditTx({ ...editTx, details: e.target.value })} />
                      : (tx.details || '-')}
                  </td>
                  <td>{credit ? credit.toFixed(2) : '-'}</td>
                  <td>{debit ? debit.toFixed(2) : '-'}</td>
                  <td>
                    {editingIdx === idx
                      ? <input type="number" value={editTx.amount || ''} onChange={e => setEditTx({ ...editTx, amount: e.target.value })} />
                      : amount.toFixed(2)}
                  </td>
                  <td>
                    {editingIdx === idx ? (
                      <>
                        <button onClick={() => saveEdit(tx, idx)}>Save</button>
                        <button onClick={() => setEditingIdx(null)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingIdx(idx); setEditTx(tx); }}>Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
              <td colSpan={2} style={{ textAlign: 'right' }}>
                {showOpeningBalance ? 'Total (Including Opening Balance)' : 'Total'}
              </td>
              <td>{totalCredit.toFixed(2)}</td>
              <td>{totalDebit.toFixed(2)}</td>
              <td>
                {showOpeningBalance 
                ? (tableOpeningBalance + totalCredit - totalDebit).toFixed(2)
                : (totalCredit - totalDebit).toFixed(2)}
              </td>
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

  function calculateOpeningBalance(transactions, fromDate) {
    if (!fromDate) return 0;
    return transactions
      .filter(tx => tx.date && tx.date < fromDate)
      .reduce((sum, tx) => {
        const amount = Number(tx.amount);
        if (tx.credit) return sum + amount;
        if (tx.debit) return sum - amount;
        return sum;
      }, 0);
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
            <div className="mb-3">
              {mode === 'Bank' && selectedBank && fromDate && (
                <>
                  <strong>Opening Balance for {selectedBank} as on {formatDate(fromDate)}: </strong>
                  {(() => {
                    const bankObj = banks.find(b => b.bank_name === selectedBank);
                    const txs = transactions.filter(tx => tx.bank_name === selectedBank);
                    let opening = calculateOpeningBalance(txs, fromDate);
                    // Agar koi transaction nahi hai aur fromDate blank hai, to banks table ka amount dikhao
                    if ((!txs || txs.length === 0) && (!fromDate || fromDate === '')) {
                      return bankObj ? Number(bankObj.amount).toFixed(2) : '0.00';
                    }
                    return opening.toFixed(2);
                  })()}
                </>
              )}
              {mode === 'Cash' && fromDate && (
                <>
                  <strong>Cash Opening Balance as on {formatDate(fromDate)}: </strong>
                  {calculateOpeningBalance(
                    transactions.filter(tx => tx.type === 'Cash' || tx.cash),
                    fromDate
                  ).toFixed(2)}
                </>
              )}
              {/* Remove the All mode opening balance display */}
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