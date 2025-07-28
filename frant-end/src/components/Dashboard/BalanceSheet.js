import React, { useState, useEffect } from "react";
import { fetchBalanceSheet, saveBalanceSheetSnapshot } from '../../services/balanceSheetApi';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/balancesheet.css';

const BalanceSheet = () => {
  // Default to current financial year
  const getDefaultFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    if (today.getMonth() + 1 >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };
  const [financialYear, setFinancialYear] = useState(getDefaultFinancialYear());
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchBalanceSheet(financialYear)
      .then(data => setSheet(data.data))
      .catch(() => {
        setSheet(null);
        setError("No data found for this financial year.");
      })
      .finally(() => setLoading(false));
  }, [financialYear]);

  const handleSaveSnapshot = () => {
    setSaving(true);
    saveBalanceSheetSnapshot(financialYear)
      .then(() => alert('Snapshot saved!'))
      .catch(() => alert('Failed to save snapshot.'))
      .finally(() => setSaving(false));
  };

  // Helper to get display name for OtherTransaction
  const getOtherDisplayName = (type, entry) => {
    if (type === 'Loan' && entry.bank_name) return entry.bank_name;
    if (entry.name) return entry.name;
    return '';
  };

  return (
    <div>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <div className="balance-sheet-container">
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Balance Sheet - {financialYear}</h2>
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Left side: Label + Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label>Financial Year:</label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={e => setFinancialYear(e.target.value)}
                  pattern="\\d{4}-\\d{4}"
                  placeholder="YYYY-YYYY"
                  minLength={9}
                  maxLength={9}
                  style={{ width: 200, padding: '6px 10px' }}
                />
              </div>

              {/* Right side: Button */}
              <button
                onClick={handleSaveSnapshot}
                disabled={saving}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                {saving ? 'Saving...' : 'Save Snapshot'}
              </button>
            </div>

            {loading ? <div>Loading...</div> : (
              sheet ? (
                <div className="balance-sheet-sections">
                  {/* Credit Side */}
                  <div className="balance-sheet-column">
                    {sheet.capital && sheet.capital.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Capital</h4>
                        <table><tbody>
                          {sheet.capital.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.partner_name || item.name || item.notice}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {sheet.loan_credit && sheet.loan_credit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Loan (Credit)</h4>
                        <table><tbody>
                          {sheet.loan_credit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {sheet.unsecure_loan_credit && sheet.unsecure_loan_credit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Unsecure Loan (Credit)</h4>
                        <table><tbody>
                          {sheet.unsecure_loan_credit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {/* Sundry Creditors - Creditors on the left */}
                    {sheet.sundry_debtors_creditors && sheet.sundry_debtors_creditors.filter(e => e.type === 'Creditor').length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Sundry Creditors</h4>
                        <table><tbody>
                          {sheet.sundry_debtors_creditors.filter(e => e.type === 'Creditor').map((entry, idx) => (
                            <tr key={entry.name + idx}>
                              <td>{entry.amount}</td>
                              <td style={{ textAlign: 'right' }}>{entry.name}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {/* Custom Types Credit */}
                    {sheet.custom_types_credit && Object.keys(sheet.custom_types_credit).length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Custom Types (Credit)</h4>
                        {Object.entries(sheet.custom_types_credit).map(([type, entries]) => (
                          <div key={type}>
                            <strong>{type}</strong>
                            <table><tbody>
                              {entries.map((entry, idx) => (
                                <tr key={idx}>
                                  <td>{entry[1]}</td>
                                  <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                                </tr>
                              ))}
                            </tbody></table>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Fixed Assets (Credit) - Credit side */}
                    {sheet.fixed_assets_credit && sheet.fixed_assets_credit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Fixed Assets (Credit)</h4>
                        <table><tbody>
                          {sheet.fixed_assets_credit.map(([name, amt]) => (
                            <tr key={name}><td>{amt}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                  </div>
                                      {/* Debit Side */}
                    <div className="balance-sheet-column">
                      {sheet.fixed_assets_debit && sheet.fixed_assets_debit.length > 0 && (
                        <div className="balance-sheet-box">
                          <h4>Fixed Assets (Debit)</h4>
                          <table><tbody>
                            {sheet.fixed_assets_debit.map(([name, amt]) => (
                              <tr key={name}><td>{amt}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                            ))}
                          </tbody></table>
                        </div>
                      )}
                    {sheet.loan_debit && sheet.loan_debit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Loan (Debit)</h4>
                        <table><tbody>
                          {sheet.loan_debit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {sheet.unsecure_loan_debit && sheet.unsecure_loan_debit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Unsecure Loan (Debit)</h4>
                        <table><tbody>
                          {sheet.unsecure_loan_debit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {sheet.salary && sheet.salary.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Expense</h4>
                        <table><tbody>
                          {sheet.salary.map(([name, amt]) => (
                            <tr key={name}><td>{amt}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>Total</td>
                            <td style={{ textAlign: 'right' }}>{sheet.salary_total}</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}
                    {sheet.buyer && sheet.buyer.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Buyers</h4>
                        <table><tbody>
                          {sheet.buyer.map(([name, amt]) => (
                            <tr key={name}><td>{amt}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>Total</td>
                            <td style={{ textAlign: 'right' }}>{sheet.buyer_total}</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}
                    {/* Sundry Debtors - Debtors on the right */}
                    {sheet.sundry_debtors_creditors && sheet.sundry_debtors_creditors.filter(e => e.type === 'Debtor').length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Sundry Debtors</h4>
                        <table><tbody>
                          {sheet.sundry_debtors_creditors.filter(e => e.type === 'Debtor').map((entry, idx) => (
                            <tr key={entry.name + idx}>
                              <td>{entry.amount}</td>
                              <td style={{ textAlign: 'right' }}>{entry.name}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                    {/* Custom Types Debit */}
                    {sheet.custom_types_debit && Object.keys(sheet.custom_types_debit).length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Custom Types (Debit)</h4>
                        {Object.entries(sheet.custom_types_debit).map(([type, entries]) => (
                          <div key={type}>
                            <strong>{type}</strong>
                            <table><tbody>
                              {entries.map((entry, idx) => (
                                <tr key={idx}>
                                  <td>{entry[1]}</td>
                                  <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                                </tr>
                              ))}
                            </tbody></table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : <div>{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet; 