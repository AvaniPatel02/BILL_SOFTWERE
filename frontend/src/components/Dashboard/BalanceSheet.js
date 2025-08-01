import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBalanceSheet } from '../../services/balanceSheetApi';
import { fetchBanks, calculateBankTotals, fetchCashEntries, calculateCashTotals } from '../../services/bankCashApi';
import Sidebar from './Sidebar';
import Header from './Header';
import BalanceSheetPDF from './BalanceSheetPDF';
import '../../styles/balancesheet.css';

const BalanceSheet = () => {
  const navigate = useNavigate();
  
  // Generate financial year options from 2022 to current year
  const generateFinancialYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let year = 2022; year <= currentYear; year++) {
      options.push(`${year}-${year + 1}`);
    }
    
    return options;
  };

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
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [banks, setBanks] = useState([]);
  const [bankTotals, setBankTotals] = useState({});
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [cashEntries, setCashEntries] = useState([]);
  const [cashTotals, setCashTotals] = useState({});
  const [loadingCash, setLoadingCash] = useState(true);
  const financialYearOptions = generateFinancialYearOptions();

  // Fetch balance sheet data
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

  // Fetch bank data
  useEffect(() => {
    setLoadingBanks(true);
    fetchBanks()
      .then(banksData => {
        setBanks(banksData);
        // Calculate totals for each bank
        const fetchBankTotals = async () => {
          const totals = {};
          for (const bank of banksData) {
            try {
              const result = await calculateBankTotals(bank.bank_name);
              totals[bank.id] = result;
            } catch (e) {
              totals[bank.id] = { netAmount: '0.00' };
            }
          }
          setBankTotals(totals);
        };
        fetchBankTotals();
      })
      .catch(err => {
        console.error('Error fetching banks:', err);
        setBanks([]);
      })
      .finally(() => setLoadingBanks(false));
  }, []);

  // Fetch cash data
  useEffect(() => {
    setLoadingCash(true);
    fetchCashEntries()
      .then(cashData => {
        setCashEntries(cashData);
        // Calculate cash totals
        const fetchCashTotals = async () => {
          try {
            const result = await calculateCashTotals();
            setCashTotals(result);
          } catch (e) {
            setCashTotals({ netAmount: '0.00' });
          }
        };
        fetchCashTotals();
      })
      .catch(err => {
        console.error('Error fetching cash entries:', err);
        setCashEntries([]);
      })
      .finally(() => setLoadingCash(false));
  }, []);

  const handleGeneratePDF = () => {
    setDownloadingPDF(true);
  };

  const handlePDFDownloadComplete = () => {
    setDownloadingPDF(false);
  };

  // Handle click on Capital partner to show account statement
  const handleCapitalPartnerClick = (partnerName) => {
    navigate('/account-statement', {
      state: {
        buyer_name: partnerName,
        buyer_address: '',
        buyer_gst: ''
      }
    });
  };

  // Helper to get display name for OtherTransaction
  const getOtherDisplayName = (type, entry) => {
    if (type === 'Loan' && entry.bank_name) return entry.bank_name;
    if (entry.name) return entry.name;
    return '';
  };

  // Helper to calculate bank balance
  const getBankBalance = (bank) => {
    const totals = bankTotals[bank.id] || { netAmount: '0.00' };
    const baseAmount = parseFloat(bank.amount) || 0;
    const netTransactions = parseFloat(totals.netAmount) || 0;
    return (baseAmount + netTransactions).toFixed(2);
  };

  // Helper to calculate cash balance
  const getCashBalance = (cashEntry) => {
    const totals = cashTotals || { netAmount: '0.00' };
    const baseAmount = parseFloat(cashEntry.amount) || 0;
    const netTransactions = parseFloat(totals.netAmount) || 0;
    return (baseAmount + netTransactions).toFixed(2);
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
              {/* Left side: Label + Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label>Financial Year:</label>
                <select
                  value={financialYear}
                  onChange={e => setFinancialYear(e.target.value)}
                  style={{ 
                    width: 200, 
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px'
                  }}
                >
                  {financialYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right side: Button */}
              <button
                onClick={handleGeneratePDF}
                disabled={downloadingPDF}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                {downloadingPDF ? 'Generating PDF...' : 'Generate PDF'}
              </button>
            </div>

            {loading ? <div>Loading...</div> : (
              sheet ? (
                <div className="balance-sheet-sections" style={{ display: 'flex', gap: '20px' }}>
                  {/* Credit Side */}
                  <div className="balance-sheet-column" style={{ flex: 1 }}>
                    {sheet.capital && sheet.capital.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Capital</h4>
                        <table><tbody>
                          {sheet.capital.map((item, idx) => {
                            const partnerName = item.partner_name || item.name || item.notice;
                            const isCarryForward = partnerName.includes('(Carry-forward)');
                            const displayName = isCarryForward ? partnerName.replace('(Carry-forward)', '').trim() : partnerName;
                            
                            return (
                              <tr key={item.name + idx}>
                                <td>{item.amount}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <span 
                                    className={isCarryForward ? 'non-clickable-partner' : 'clickable-partner'}
                                    onClick={() => !isCarryForward && handleCapitalPartnerClick(displayName)}
                                    title={isCarryForward ? 'Carry-forward entry' : `Click to view ${displayName}'s account statement`}
                                  >
                                    {partnerName}
                                    {isCarryForward && (
                                      <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>↻</span>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.capital.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
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
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.loan_credit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
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
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.unsecure_loan_credit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
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
                              <td style={{ textAlign: 'right' }}>
                                {entry.name}
                                {entry.name.includes('(Carry-forward)') && (
                                  <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>↻</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const creditors = sheet.sundry_debtors_creditors.filter(e => e.type === 'Creditor');
                              const total = creditors.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}
                    {/* Dynamic Sections Credit */}
                    {sheet.dynamic_sections && Object.keys(sheet.dynamic_sections).length > 0 && 
                      Object.entries(sheet.dynamic_sections).map(([sectionName, sectionData]) => (
                        sectionData.credit && sectionData.credit.length > 0 && (
                          <div className="balance-sheet-box" key={`credit-${sectionName}`}>
                            <h4>{sectionName} (Credit)</h4>
                            <table><tbody>
                              {sectionData.credit.map((entry, idx) => (
                                <tr key={idx}>
                                  <td>{entry[1]}</td>
                                  <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                                <td>{(() => {
                                  const total = sectionData.credit.reduce((sum, entry) => sum + (parseFloat(entry[1]) || 0), 0);
                                  return total.toFixed(2);
                                })()}</td>
                                <td style={{ textAlign: 'right' }}>Total</td>
                              </tr>
                            </tbody></table>
                          </div>
                        )
                      ))
                    }
                  </div>

                  {/* Debit Side */}
                  <div className="balance-sheet-column" style={{ flex: 1 }}>
                    {sheet.fixed_assets_credit && sheet.fixed_assets_credit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Fixed Assets (Credit)</h4>
                        <table><tbody>
                          {sheet.fixed_assets_credit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.name || item.notice}</td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.fixed_assets_credit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}
                    {sheet.fixed_assets_debit && sheet.fixed_assets_debit.length > 0 && (
                      <div className="balance-sheet-box">
                        <h4>Fixed Assets (Debit)</h4>
                        <table><tbody>
                          {sheet.fixed_assets_debit.map((item, idx) => (
                            <tr key={item.name + idx}>
                              <td>{item.amount}</td>
                              <td style={{ textAlign: 'right' }}>{item.name || item.notice}</td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.fixed_assets_debit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
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
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.loan_debit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
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
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const total = sheet.unsecure_loan_debit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}

                    {/* Cash Details Section - Above Bank Details */}
                    <div className="balance-sheet-box">
                      <h4>Cash Details</h4>
                      {loadingCash ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          Loading cash details...
                        </div>
                      ) : cashEntries.length > 0 ? (
                        <table style={{ width: '100%' }}>
                          <tbody>
                            {cashEntries.map((cashEntry) => (
                              <tr key={cashEntry.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px 0', fontSize: '14px' }}>
                                  <div style={{ fontWeight: '600', color: '#333' }}>Cash Entry</div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {cashEntry.date} - {cashEntry.description || 'No description'}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600', color: '#28a745' }}>
                                  ₹{getCashBalance(cashEntry)}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc', marginTop: '10px' }}>
                              <td style={{ padding: '8px 0' }}>Total</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: '#28a745' }}>
                                ₹{(() => {
                                  const total = cashEntries.reduce((sum, cashEntry) => sum + parseFloat(getCashBalance(cashEntry)), 0);
                                  return total.toFixed(2);
                                })()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
                          No cash entries found
                        </div>
                      )}
                    </div>

                    {/* Bank Details Section - Above Expense */}
                    <div className="balance-sheet-box">
                      <h4>Bank Details</h4>
                      {loadingBanks ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          Loading bank details...
                        </div>
                      ) : banks.length > 0 ? (
                        <table style={{ width: '100%' }}>
                          <tbody>
                            {banks.map((bank) => (
                              <tr key={bank.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px 0', fontSize: '14px' }}>
                                  <div style={{ fontWeight: '600', color: '#333' }}>{bank.bank_name}</div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>A/C: {bank.account_number}</div>
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600', color: '#28a745' }}>
                                  ₹{getBankBalance(bank)}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc', marginTop: '10px' }}>
                              <td style={{ padding: '8px 0' }}>Total</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: '#28a745' }}>
                                ₹{(() => {
                                  const total = banks.reduce((sum, bank) => sum + parseFloat(getBankBalance(bank)), 0);
                                  return total.toFixed(2);
                                })()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
                          No bank accounts found
                        </div>
                      )}
                    </div>

                    {/* Combined Expense Section */}
                    {(() => {
                      const salaryExpenses = sheet.salary || [];
                      const otherExpenses = sheet.dynamic_sections && sheet.dynamic_sections.Expense ? sheet.dynamic_sections.Expense.debit || [] : [];
                      
                      // Debug: Log the salary data
                      console.log('Raw salary data from backend:', salaryExpenses);
                      console.log('Sheet data:', sheet);
                      
                      // Convert salary data format from backend [["name", amount]] to frontend format
                      const convertedSalaryExpenses = salaryExpenses.map(item => {
                        if (Array.isArray(item)) {
                          // Backend format: ["employee_name", amount]
                          return { name: item[0], amount: item[1] };
                        } else {
                          // Frontend format: {name: "employee_name", amount: amount}
                          return item;
                        }
                      });
                      
                      // Group salary expenses by employee name and sum their amounts
                      const salaryGrouped = {};
                      convertedSalaryExpenses.forEach(item => {
                        const employeeName = item.name || item.notice || 'Unknown Employee';
                        if (!salaryGrouped[employeeName]) {
                          salaryGrouped[employeeName] = 0;
                        }
                        salaryGrouped[employeeName] += parseFloat(item.amount) || 0;
                      });
                      
                      // Convert grouped salary to array format and filter out zero amounts
                      const groupedSalaryExpenses = Object.entries(salaryGrouped)
                        .filter(([name, total]) => total > 0 && name !== 'Unknown Employee')
                        .map(([name, total]) => [name, total.toFixed(2)]);
                      
                      const allExpenses = [
                        ...groupedSalaryExpenses,
                        ...otherExpenses
                      ];
                      const totalExpense = allExpenses.reduce((sum, [name, amt]) => sum + (parseFloat(amt) || 0), 0);
                      
                      // Debug: Log the final processed data
                      console.log('Converted salary expenses:', convertedSalaryExpenses);
                      console.log('Grouped salary expenses:', groupedSalaryExpenses);
                      console.log('All expenses:', allExpenses);
                      
                      return allExpenses.length > 0 ? (
                        <div className="balance-sheet-box">
                          <h4>Expense</h4>
                          <table><tbody>
                            {allExpenses.map(([name, amt], idx) => (
                              <tr key={`expense-${idx}`}><td>{amt}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                            ))}
                            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                              <td>Total</td>
                              <td style={{ textAlign: 'right' }}>{totalExpense.toFixed(2)}</td>
                            </tr>
                          </tbody></table>
                        </div>
                      ) : null;
                    })()}
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
                              <td style={{ textAlign: 'right' }}>
                                {entry.name}
                                {entry.name.includes('(Carry-forward)') && (
                                  <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>↻</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                            <td>{(() => {
                              const debtors = sheet.sundry_debtors_creditors.filter(e => e.type === 'Debtor');
                              const total = debtors.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                              return total.toFixed(2);
                            })()}</td>
                            <td style={{ textAlign: 'right' }}>Total</td>
                          </tr>
                        </tbody></table>
                      </div>
                    )}
                    {/* Dynamic Sections Debit - Exclude Expense since it's handled separately */}
                    {sheet.dynamic_sections && Object.keys(sheet.dynamic_sections).length > 0 && 
                      Object.entries(sheet.dynamic_sections).map(([sectionName, sectionData]) => (
                        sectionData.debit && sectionData.debit.length > 0 && sectionName.toLowerCase() !== 'expense' && (
                          <div className="balance-sheet-box" key={`debit-${sectionName}`}>
                            <h4>{sectionName} (Debit)</h4>
                            <table><tbody>
                              {sectionData.debit.map((entry, idx) => (
                                <tr key={idx}>
                                  <td>{entry[1]}</td>
                                  <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                                <td>{(() => {
                                  const total = sectionData.debit.reduce((sum, entry) => sum + (parseFloat(entry[1]) || 0), 0);
                                  return total.toFixed(2);
                                })()}</td>
                                <td style={{ textAlign: 'right' }}>Total</td>
                              </tr>
                            </tbody></table>
                          </div>
                        )
                      ))
                    }
                  </div>
                </div>
              ) : <div>{error}</div>
            )}
          </div>
          
          {/* PDF Generation Component */}
          {downloadingPDF && sheet && (
            <BalanceSheetPDF 
              sheet={sheet} 
              financialYear={financialYear} 
              banks={banks}
              bankTotals={bankTotals}
              cashEntries={cashEntries}
              cashTotals={cashTotals}
              onDownloadComplete={handlePDFDownloadComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet; 