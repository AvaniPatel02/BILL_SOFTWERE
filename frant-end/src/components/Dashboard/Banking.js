import React, { useState } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import '../../styles/Banking.css';

const sampleCompanies = ["ABC Pvt Ltd", "XYZ Ltd", "Demo Company"];
const sampleInvoices = ["INV-001", "INV-002", "INV-003"];
const sampleBuyers = ["Buyer One", "Buyer Two", "Buyer Three"];
const sampleBanks = ["SBI", "HDFC", "ICICI"];
const sampleEmployees = ["John Doe", "Jane Smith", "Amit Kumar"];
const sampleTypes = ["Fast Expand", "Profit", "Other"];

// Helper for input fields
const Input = ({ type = "text", ...props }) => (
  <input className="banking-input" type={type} {...props} />
);

// Helper for select fields
const Select = ({ options, children, ...props }) => (
  <select className="banking-input" {...props}>
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
  paymentType: "",
  bank: "",
  transactionType: "debit"
};

const Banking = () => {
  const [visibleButton, setVisibleButton] = useState(null);
  const [companyForm, setCompanyForm] = useState(initialCompany);
  const [buyerForm, setBuyerForm] = useState(initialBuyer);
  const [salaryForm, setSalaryForm] = useState(initialSalary);
  const [otherForm, setOtherForm] = useState(initialOther);

  // Generic reset function
  const resetForm = (formSetter, initial) => formSetter(initial);

  return (
    <div className="banking-container">
      <Header />
      <Sidebar />
      <div className="container">
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
            <form className="banking-form" onSubmit={e => e.preventDefault()}>
              <h3>Company Bill</h3>
              <label>Company Name</label>
              <Select value={companyForm.company} onChange={e => setCompanyForm(f => ({ ...f, company: e.target.value }))} options={sampleCompanies} required>
                <option value="">-- Select Company --</option>
              </Select>
              <label>Invoice Number</label>
              <Select value={companyForm.invoice} onChange={e => setCompanyForm(f => ({ ...f, invoice: e.target.value }))} options={sampleInvoices}>
                <option value="">-- Select Invoice (Optional) --</option>
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
                  <Select value={companyForm.bank} onChange={e => setCompanyForm(f => ({ ...f, bank: e.target.value }))} options={sampleBanks} required>
                    <option value="">-- Select Bank --</option>
                  </Select>
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
            <form className="banking-form" onSubmit={e => e.preventDefault()}>
              <h3>Buyer Bill</h3>
              <label style={{marginBottom: 8}}>
                <input type="checkbox" checked={buyerForm.manual} onChange={() => setBuyerForm(f => ({ ...f, manual: !f.manual, name: "" }))} /> Enter Buyer Name Manually
              </label>
              {buyerForm.manual ? (
                <>
                  <label>Buyer Name</label>
                  <Input placeholder="Buyer Name*" value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} required />
                </>
              ) : (
                <>
                  <label>Buyer Name</label>
                  <Select value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} options={sampleBuyers} required>
                    <option value="">-- Select Buyer --</option>
                  </Select>
                </>
              )}
              <label>Date</label>
              <Input type="date" value={buyerForm.date} onChange={e => setBuyerForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Amount</label>
              <Input type="number" placeholder="Amount*" value={buyerForm.amount} onChange={e => setBuyerForm(f => ({ ...f, amount: e.target.value }))} required />
              <label>Notice</label>
              <Input placeholder="Notice (Optional)" value={buyerForm.notice} onChange={e => setBuyerForm(f => ({ ...f, notice: e.target.value }))} />
              <label>Payment Type</label>
              <Select value={buyerForm.paymentType} onChange={e => setBuyerForm(f => ({ ...f, paymentType: e.target.value }))} required>
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </Select>
              {buyerForm.paymentType === "Banking" && (
                <>
                  <label>Bank</label>
                  <Select value={buyerForm.bank} onChange={e => setBuyerForm(f => ({ ...f, bank: e.target.value }))} options={sampleBanks} required>
                    <option value="">-- Select Bank --</option>
                  </Select>
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
            <form className="banking-form" onSubmit={e => e.preventDefault()}>
              <h3>Salary</h3>
              <label>Employee Name</label>
              <Select value={salaryForm.name} onChange={e => setSalaryForm(f => ({ ...f, name: e.target.value }))} options={sampleEmployees} required>
                <option value="">-- Select Employee --</option>
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
                  <Select value={salaryForm.bank} onChange={e => setSalaryForm(f => ({ ...f, bank: e.target.value }))} options={sampleBanks} required>
                    <option value="">-- Select Bank --</option>
                  </Select>
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
            <form className="banking-form" onSubmit={e => e.preventDefault()}>
              <h3>Other</h3>
              <label>Account Type</label>
              <Select value={otherForm.type} onChange={e => setOtherForm(f => ({ ...f, type: e.target.value }))} options={sampleTypes} required>
                <option value="">Select Account</option>
              </Select>
              <label>Date</label>
              <Input type="date" value={otherForm.date} onChange={e => setOtherForm(f => ({ ...f, date: e.target.value }))} required />
              <label>Amount</label>
              <Input type="number" placeholder="Amount" value={otherForm.amount} onChange={e => setOtherForm(f => ({ ...f, amount: e.target.value }))} required />
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
                  <Select value={otherForm.bank} onChange={e => setOtherForm(f => ({ ...f, bank: e.target.value }))} options={sampleBanks} required>
                    <option value="">-- Select Bank --</option>
                  </Select>
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