import React, { useState, useEffect } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import '../../styles/Banking.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  submitCompanyBill,
  submitBuyerBill,
  submitSalary,
  submitOtherTransaction,
  getUniqueBuyerNames,
  getInvoicesByBuyer,
  fetchOtherTypes,
  addOtherType
} from '../../services/bankingApi';
import { fetchBanks } from '../../services/bankCashApi';
import { fetchBuyerNames, addBuyerName } from '../../services/buyerApi';
import { getEmployees } from '../../services/employeeApi';

const sampleBuyers = ["Buyer One", "Buyer Two", "Buyer Three"];
const sampleEmployees = ["John Doe", "Jane Smith", "Amit Kumar"];
const sampleTypes = ["Fast Expand", "Profit", "Other"];
const sampleCompanies = ["ABC Pvt Ltd", "XYZ Ltd", "Demo Company"];
const sampleInvoices = ["INV-001", "INV-002", "INV-003"];

// Helper for input fields
const Input = ({ type = "text", ...props }) => (
  <input className="banking-input banking-input-bankingjs" type={type} {...props} />
);

// Helper for select fields
const Select = ({ options, children, ...props }) => (
  <select className="banking-input banking-input-bankingjs" {...props}>
    {children}
    {options && options.map((opt, i) => (
      <option key={i} value={opt}>{opt}</option>
    ))}
  </select>
);

const initialCompany = {
  company: "",
  invoice: "",
  date: "",
  notice: "",
  amount: "",
  paymentType: "",
  bank: ""
};
const initialBuyer = {
  name: "",
  date: "",
  amount: "",
  notice: "",
  paymentType: "",
  bank: "",
  manual: false
};
const initialSalary = {
  name: "",
  date: "",
  amount: "",
  paymentType: "",
  bank: ""
};
const initialOther = {
  type: "",
  date: "",
  amount: "",
  notice: "",
  bank_name: "",    // NEW
  paymentType: "",
  bank: "",
  transactionType: "debit",
  manualType: false
};

const Banking = () => {
  const [visibleButton, setVisibleButton] = useState(null);
  const [companyForm, setCompanyForm] = useState(initialCompany);
  const [buyerForm, setBuyerForm] = useState(initialBuyer);
  const [salaryForm, setSalaryForm] = useState(initialSalary);
  const [otherForm, setOtherForm] = useState(initialOther);
  const [banks, setBanks] = useState([]);
  const [buyerNames, setBuyerNames] = useState([]);
  const [invoicesForBuyer, setInvoicesForBuyer] = useState([]);
  const [employees, setEmployees] = useState([]);
  const defaultTypes = ["Partner", "Loan", "Unsecure Loan", "Fixed Assets", "Assets"];
  const [otherTypes, setOtherTypes] = useState(defaultTypes);
  const [manualType, setManualType] = useState(false);
  const [newType, setNewType] = useState("");

  useEffect(() => {
    fetchBanks().then(data => {
      console.log('Fetched banks:', data);
      if (Array.isArray(data)) {
        setBanks(data);
      } else if (data && Array.isArray(data.results)) {
        setBanks(data.results);
      } else if (data && Array.isArray(data.data)) {
        setBanks(data.data);
      } else {
        setBanks([]);
      }
    });
  }, []);

  useEffect(() => {
    getEmployees().then(data => {
      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (data && Array.isArray(data.results)) {
        setEmployees(data.results);
      } else {
        setEmployees([]);
      }
    });
  }, []);

  // Auto-fill salary when employee is selected
  useEffect(() => {
    if (salaryForm.name) {
      const emp = employees.find(e => e.name === salaryForm.name);
      if (emp && emp.salary) {
        setSalaryForm(f => ({ ...f, amount: emp.salary }));
      }
    }
    // Do not clear amount if name is cleared, to allow manual override if needed
    // else if (!salaryForm.name) {
    //   setSalaryForm(f => ({ ...f, amount: '' }));
    // }
  }, [salaryForm.name, employees]);

  // Fetch buyer names when company bill form is opened
  useEffect(() => {
    if (visibleButton === 1) {
      console.log('Fetching buyer names...');
      getUniqueBuyerNames()
        .then(data => {
          console.log('Fetched buyer names response:', data);
          if (data && data.buyer_names) {
            console.log('Setting buyer names:', data.buyer_names);
            setBuyerNames(data.buyer_names);
          } else {
            console.log('No buyer names found in response');
            setBuyerNames([]);
          }
        })
        .catch(error => {
          console.error('Error fetching buyer names:', error);
          // Check if it's an authentication error
          if (error.message && error.message.includes('401')) {
            console.log('Authentication required, redirecting to login...');
            // You can add navigation to login here if needed
            // navigate('/');
          }
          setBuyerNames([]);
        });
    }
  }, [visibleButton]);

  // Fetch invoices when buyer is selected in company bill form
  useEffect(() => {
    if (companyForm.company && visibleButton === 1) {
      console.log('Fetching invoices for buyer:', companyForm.company);
      getInvoicesByBuyer(companyForm.company)
        .then(data => {
          console.log('Fetched invoices response:', data);
          if (data && data.invoices) {
            console.log('Setting invoices for buyer:', data.invoices);
            setInvoicesForBuyer(data.invoices);
          } else {
            console.log('No invoices found in response');
            setInvoicesForBuyer([]);
          }
        })
        .catch(error => {
          console.error('Error fetching invoices for buyer:', error);
          setInvoicesForBuyer([]);
        });
    } else {
      setInvoicesForBuyer([]);
    }
  }, [companyForm.company, visibleButton]);

  // Fetch buyer names when the form is shown
  useEffect(() => {
    if (visibleButton === 2) {
      fetchBuyerNames().then(data => setBuyerNames(data.buyer_names || []));
    }
  }, [visibleButton]);

  // Fetch other types on mount
  useEffect(() => {
    fetchOtherTypes().then(data => {
      let backendTypes = [];
      if (Array.isArray(data)) backendTypes = data;
      else if (data && Array.isArray(data.types)) backendTypes = data.types;
      // Merge and deduplicate (case-insensitive)
      const allTypes = [...defaultTypes];
      backendTypes.forEach(type => {
        if (!allTypes.some(def => def.toLowerCase() === type.toLowerCase())) {
          allTypes.push(type);
        }
      });
      setOtherTypes(allTypes);
    });
  }, []);

  // Helper to get bank balance by name
  const getBankAmount = (bankName) => {
    const bank = banks.find(b => b.bank_name === bankName);
    return bank ? bank.amount : '';
  };

  // Generic reset function
  const resetForm = (formSetter, initial) => formSetter(initial);

  // Helper to map camelCase to snake_case for each form
  const mapCompanyPayload = (form) => {
    return {
      ...form,
      payment_type: form.paymentType,
    };
  };
  const mapBuyerPayload = (form) => {
    return {
      ...form,
      payment_type: form.paymentType,
      manual: form.manual,
    };
  };
  const mapSalaryPayload = (form) => {
    return {
      ...form,
      payment_type: form.paymentType,
    };
  };
  // Update mapOtherPayload to include partner_name and bank_name
  const mapOtherPayload = (form) => ({
    ...form,
    payment_type: form.paymentType,
    transaction_type: form.transactionType,
    bank_name: form.type === "Loan" ? form.bank_name : "",
    name: form.type !== "Loan" ? form.name : "",
  });

  // Submit handlers for each form
  const handleCompanySubmit = (e) => {
    e.preventDefault();
    const payload = mapCompanyPayload(companyForm);
    delete payload.paymentType;
    console.log('Form data:', companyForm);
    console.log('Payload:', payload);
    submitCompanyBill(payload)
      .then(response => {
        console.log('Backend response:', response);
        if (response && response.id) {
          toast.success('Company Bill submitted!');
          resetForm(setCompanyForm, initialCompany);
        } else {
          toast.error('Error: ' + JSON.stringify(response));
        }
      })
      .catch(error => {
        toast.error('Error submitting Company Bill');
        console.error(error);
      });
  };

  const handleBuyerSubmit = async (e) => {
    e.preventDefault();
    if (buyerForm.manual && buyerForm.name) {
      // Save the new buyer name to the DB with all fields
      await addBuyerName({
        name: buyerForm.name,
        amount: buyerForm.amount,
        notes: buyerForm.notice,
        date: buyerForm.date,
        payment_type: buyerForm.paymentType
      });
      fetchBuyerNames().then(data => setBuyerNames(data.buyer_names || []));
    }
    const payload = mapBuyerPayload(buyerForm);
    delete payload.paymentType;
    delete payload.transactionType;
    console.log('Form data:', buyerForm);
    console.log('Payload:', payload);
    submitBuyerBill(payload)
      .then(response => {
        console.log('Backend response:', response);
        if (response && response.id) {
          toast.success('Buyer Bill submitted!');
          resetForm(setBuyerForm, initialBuyer);
        } else {
          toast.error('Error: ' + JSON.stringify(response));
        }
      })
      .catch(error => {
        toast.error('Error submitting Buyer Bill');
        console.error(error);
      });
  };

  const handleSalarySubmit = (e) => {
    e.preventDefault();
    const payload = mapSalaryPayload(salaryForm);
    delete payload.paymentType;
    console.log('Form data:', salaryForm);
    console.log('Payload:', payload);
    submitSalary(payload)
      .then(response => {
        console.log('Backend response:', response);
        if (response && response.id) {
          toast.success('Salary submitted!');
          resetForm(setSalaryForm, initialSalary);
        } else {
          toast.error('Error: ' + JSON.stringify(response));
        }
      })
      .catch(error => {
        toast.error('Error submitting Salary');
        console.error(error);
      });
  };

  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    let typeToUse = otherForm.type;
    if (otherForm.manualType && typeToUse && !otherTypes.includes(typeToUse)) {
      await addOtherType(typeToUse);
      // Refresh the types list
      const updatedTypes = await fetchOtherTypes();
      let backendTypes = [];
      if (Array.isArray(updatedTypes)) backendTypes = updatedTypes;
      else if (updatedTypes && Array.isArray(updatedTypes.types)) backendTypes = updatedTypes.types;
      const allTypes = [...defaultTypes];
      backendTypes.forEach(type => {
        if (!allTypes.some(def => def.toLowerCase() === type.toLowerCase())) {
          allTypes.push(type);
        }
      });
      setOtherTypes(allTypes);
    }
    const payload = mapOtherPayload(otherForm);
    delete payload.paymentType;
    delete payload.transactionType;
    console.log('Form data:', otherForm);
    console.log('Payload:', payload);
    submitOtherTransaction(payload)
      .then(response => {
        console.log('Backend response:', response);
        if (response && response.id) {
          toast.success('Other Transaction submitted!');
          resetForm(setOtherForm, initialOther);
        } else {
          toast.error('Error: ' + JSON.stringify(response));
        }
      })
      .catch(error => {
        toast.error('Error submitting Other Transaction');
        console.error(error);
      });
  };

  return (
    <div className="banking-container">
      <Header />
      <Sidebar />
      <div className="container">
        <ToastContainer />
        <div className="banking-header-group">
          <h1 className="banking-title">Banking</h1>
        </div>
        <div className="banking-section-box">
          <div className="banking-action-row">
            <button className="banking-action-btn" onClick={() => setVisibleButton(1)}>Company Bill</button>
            <button className="banking-action-btn" onClick={() => setVisibleButton(2)}>Buyer</button>
            <button className="banking-action-btn" onClick={() => setVisibleButton(3)}>Salary</button>
            <button className="banking-action-btn" onClick={() => setVisibleButton(4)}>Other</button>
          </div>
          {/* Company Bill */}
          {visibleButton === 1 && (
            <form className="banking-form" onSubmit={handleCompanySubmit}>
              <h3>Company Bill</h3>
              <label>Company Name</label>
              <Select value={companyForm.company} onChange={e => setCompanyForm(f => ({ ...f, company: e.target.value, invoice: "" }))} required>
                <option value="">-- Select Company --</option>
                {buyerNames.length > 0 ? (
                  buyerNames.map((buyerName, index) => (
                    <option key={index} value={buyerName}>{buyerName}</option>
                  ))
                ) : (
                  sampleCompanies.map((company, index) => (
                    <option key={index} value={company}>{company}</option>
                  ))
                )}
              </Select>
              <label>Invoice Number</label>
              <Select value={companyForm.invoice} onChange={e => setCompanyForm(f => ({ ...f, invoice: e.target.value }))}>
                <option value="">-- Select Invoice (Optional) --</option>
                {invoicesForBuyer.length > 0 ? (
                  invoicesForBuyer.map((invoice, index) => (
                    <option key={index} value={invoice.invoice_number}>
                      {invoice.invoice_number} - ₹{invoice.total_with_gst} ({invoice.invoice_date})
                    </option>
                  ))
                ) : (
                  sampleInvoices.map((invoice, index) => (
                    <option key={index} value={invoice}>{invoice}</option>
                  ))
                )}
              </Select>
              <label>Date</label>
              <Input type="date" value={companyForm.date} onChange={e => setCompanyForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Notice</label>
              <Input placeholder="Notice (Optional)" value={companyForm.notice} onChange={e => setCompanyForm(f => ({ ...f, notice: e.target.value }))} />
              <label>Deposit Amount</label>
              <Input type="number" placeholder="Deposit Amount*" value={companyForm.amount} onChange={e => setCompanyForm(f => ({ ...f, amount: e.target.value }))} required />
              <label>Payment Type</label>
              <Select value={companyForm.paymentType} onChange={e => setCompanyForm(f => ({ ...f, paymentType: e.target.value }))} required>
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </Select>
              {companyForm.paymentType === "Banking" && (
                <>
                  <label>Bank</label>
                  <Select
                    value={companyForm.bank}
                    onChange={e => setCompanyForm(f => ({ ...f, bank: e.target.value }))}
                    options={Array.isArray(banks) ? banks.map(b => b.bank_name) : []}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                  </Select>
                  {companyForm.bank && (
                    <span style={{ marginLeft: 10 }}>
                      Balance: {getBankAmount(companyForm.bank)}
                    </span>
                  )}
                </>
              )}
              <div className="banking-form-btn-row">
                <button className="banking-form-btn" type="submit">Submit</button>
                <button className="banking-form-btn" type="button" onClick={() => resetForm(setCompanyForm, initialCompany)}>Reset</button>
              </div>
            </form>
          )}
          {/* Buyer Bill */}
          {visibleButton === 2 && (
            <form className="banking-form" onSubmit={handleBuyerSubmit}>
              <h3>Buyer Bill</h3>
              <label style={{marginBottom: 8}}>
                <input type="checkbox" checked={buyerForm.manual} onChange={() => setBuyerForm(f => ({ ...f, manual: !f.manual, name: "" }))} /> Enter Buyer Name Manually
              </label>
              <label>Buyer Name</label>
              {buyerForm.manual ? (
                <Input placeholder="Buyer Name*" value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} required />
              ) : (
                <Select value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} options={buyerNames} required>
                  <option value="">-- Select Buyer --</option>
                </Select>
              )}
              <label>Amount</label>
              <Input type="number" placeholder="Amount*" value={buyerForm.amount} onChange={e => setBuyerForm(f => ({ ...f, amount: e.target.value }))} required />
              <label>Notes</label>
              <Input placeholder="Notes (Optional)" value={buyerForm.notice} onChange={e => setBuyerForm(f => ({ ...f, notice: e.target.value }))} />
              <label>Date</label>
              <Input type="date" value={buyerForm.date} onChange={e => setBuyerForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Payment Type</label>
              <Select value={buyerForm.paymentType} onChange={e => setBuyerForm(f => ({ ...f, paymentType: e.target.value }))} required>
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </Select>
              {buyerForm.paymentType === "Banking" && (
                <>
                  <label>Bank</label>
                  <Select
                    value={buyerForm.bank}
                    onChange={e => setBuyerForm(f => ({ ...f, bank: e.target.value }))}
                    options={Array.isArray(banks) ? banks.map(b => b.bank_name) : []}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                  </Select>
                  {buyerForm.bank && (
                    <span style={{ marginLeft: 10 }}>
                      Balance: {getBankAmount(buyerForm.bank)}
                    </span>
                  )}
                </>
              )}
              <div className="banking-form-btn-row">
                <button className="banking-form-btn" type="submit">Submit</button>
                <button className="banking-form-btn" type="button" onClick={() => resetForm(setBuyerForm, initialBuyer)}>Reset</button>
              </div>
            </form>
          )}
          {/* Salary */}
          {visibleButton === 3 && (
            <form className="banking-form" onSubmit={handleSalarySubmit}>
              <h3>Salary</h3>
              <label>Employee Name</label>
              <Select value={salaryForm.name} onChange={e => setSalaryForm(f => ({ ...f, name: e.target.value }))} required>
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </Select>
              <label>Date</label>
              <Input type="date" value={salaryForm.date} onChange={e => setSalaryForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Salary Amount</label>
              <Input type="number" placeholder="Salary Amount" value={salaryForm.amount} onChange={e => setSalaryForm(f => ({ ...f, amount: e.target.value }))} required />
              <label>Payment Type</label>
              <Select value={salaryForm.paymentType} onChange={e => setSalaryForm(f => ({ ...f, paymentType: e.target.value }))} required>
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </Select>
              {salaryForm.paymentType === "Banking" && (
                <>
                  <label>Bank</label>
                  <Select
                    value={salaryForm.bank}
                    onChange={e => setSalaryForm(f => ({ ...f, bank: e.target.value }))}
                    options={Array.isArray(banks) ? banks.map(b => b.bank_name) : []}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                  </Select>
                  {salaryForm.bank && (
                    <span style={{ marginLeft: 10 }}>
                      Balance: {getBankAmount(salaryForm.bank)}
                    </span>
                  )}
                </>
              )}
              <div className="banking-form-btn-row">
                <button className="banking-form-btn" type="submit">Submit</button>
                <button className="banking-form-btn" type="button" onClick={() => resetForm(setSalaryForm, initialSalary)}>Reset</button>
              </div>
            </form>
          )}
          {/* Other */}
          {visibleButton === 4 && (
            <form className="banking-form" onSubmit={handleOtherSubmit}>
              <h3>Other</h3>
              <label style={{marginBottom: 8}}>
                <input
                  type="checkbox"
                  checked={manualType}
                  onChange={() => {
                    setManualType(!manualType);
                    setNewType("");
                    if (!manualType) setOtherForm(f => ({ ...f, type: "" }));
                  }}
                /> Enter Type Manually
              </label>
              {!manualType ? (
                <Select
                  value={otherForm.type || ""}
                  onChange={e => setOtherForm(f => ({ ...f, type: e.target.value }))}
                  required
                >
                  <option value="">Select Account</option>
                  {otherTypes.map((type, idx) => (
                    <option key={type.toLowerCase()} value={type}>{type}</option>
                  ))}
                </Select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    placeholder="Enter new type"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        newType &&
                        !otherTypes.some(t => t.toLowerCase() === newType.toLowerCase())
                      ) {
                        await addOtherType(newType);
                        const updatedTypes = await fetchOtherTypes();
                        // Merge and deduplicate again
                        const allTypes = [...defaultTypes];
                        let backendTypes = [];
                        if (Array.isArray(updatedTypes)) backendTypes = updatedTypes;
                        else if (updatedTypes && Array.isArray(updatedTypes.types)) backendTypes = updatedTypes.types;
                        backendTypes.forEach(type => {
                          if (!allTypes.some(def => def.toLowerCase() === type.toLowerCase())) {
                            allTypes.push(type);
                          }
                        });
                        setOtherTypes(allTypes);
                        setOtherForm(f => ({ ...f, type: newType }));
                        setManualType(false);
                        setNewType("");
                      }
                    }}
                    style={{ padding: '6px 12px' }}
                  >
                    Add
                  </button>
                </div>
              )}
              <label>Date</label>
              <Input type="date" value={otherForm.date} onChange={e => setOtherForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Amount</label>
              <Input type="number" placeholder="Amount" value={otherForm.amount} onChange={e => setOtherForm(f => ({ ...f, amount: e.target.value }))} required />
              {/* Conditional fields for Partner and Loan */}
              {otherForm.type === "Loan" ? (
                <>
                  <label>Bank Name</label>
                  <Input
                    placeholder="Bank Name*"
                    value={otherForm.bank_name}
                    onChange={e => setOtherForm(f => ({ ...f, bank_name: e.target.value }))}
                    required
                  />
                </>
              ) : otherForm.type ? (
                <>
                  <label>Name</label>
                  <Input
                    placeholder="Name*"
                    value={otherForm.name}
                    onChange={e => setOtherForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </>
              ) : null}
              <label>Notice</label>
              <Input placeholder="Notice (Optional)" value={otherForm.notice} onChange={e => setOtherForm(f => ({ ...f, notice: e.target.value }))} />
              <div style={{display: 'flex', gap: 16, marginBottom: 8}}>
                <label style={{marginRight: 10}}>
                  <input type="radio" name="transactionType" value="credit" checked={otherForm.transactionType === 'credit'} onChange={() => setOtherForm(f => ({ ...f, transactionType: 'credit' }))} style={{ width: '15px', height: '15px', marginRight: '5px' }} />
                  Credit
                </label>
                <label style={{marginRight: 10}}>
                  <input type="radio" name="transactionType" value="debit" checked={otherForm.transactionType === 'debit'} onChange={() => setOtherForm(f => ({ ...f, transactionType: 'debit' }))} style={{ width: '15px', height: '15px', marginRight: '5px' }} />
                  Debit
                </label>
              </div>
              <label>Payment Type</label>
              <Select value={otherForm.paymentType} onChange={e => setOtherForm(f => ({ ...f, paymentType: e.target.value }))} required>
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </Select>
              {otherForm.paymentType === "Banking" && (
                <>
                  <label>Bank</label>
                  <Select
                    value={otherForm.bank}
                    onChange={e => setOtherForm(f => ({ ...f, bank: e.target.value }))}
                    options={Array.isArray(banks) ? banks.map(b => b.bank_name) : []}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                  </Select>
                  {otherForm.bank && (
                    <span style={{ marginLeft: 10 }}>
                      Balance: {getBankAmount(otherForm.bank)}
                    </span>
                  )}
                </>
              )}
              <div className="banking-form-btn-row">
                <button className="banking-form-btn" type="submit">Submit</button>
                <button className="banking-form-btn" type="button" onClick={() => resetForm(setOtherForm, initialOther)}>Reset</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banking; 