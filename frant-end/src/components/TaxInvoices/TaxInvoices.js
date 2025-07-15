import React, { useState, useEffect } from 'react';
import Sidebar from '../Dashboard/Sidebar';
import '../../styles/TaxInvoices.css';
import html2pdf from 'html2pdf.js';
import { fetchSettings } from '../../services/settingsApi';
import { calculateInvoice, saveInvoice } from '../../services/calculateInvoiceApi';



const sentenceCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const Taxinvoices = () => {
  // State for all fields
  const [billTo, setBillTo] = useState({ title: '', address: '', gst: '' });
  const [shipTo, setShipTo] = useState({ title: '', address: '', gst: '' });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [deliveryNote, setDeliveryNote] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('');
  const [destination, setDestination] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');
  const [countryList, setCountryList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({ name: 'India', symbol: '₹', code: 'INR' });
  const [gstConsultancy, setGstConsultancy] = useState('');
  const [hnsSelect, setHnsSelect] = useState('9983');
  const [totalHours, setTotalHours] = useState('');
  const [rate, setRate] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [showInsideIndia, setShowInsideIndia] = useState(true);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  // Calculation result state from backend
  const [calculationResult, setCalculationResult] = useState({});
  // Settings state
  const [settings, setSettings] = useState(null);
  const [financialYear, setFinancialYear] = useState('');
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(true);
  const [formDisabled, setFormDisabled] = useState(false);
  // Fetch settings from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      fetchSettings(token).then(res => {
        setSettings(res.data || res);
      });
    }
  }, []);
  // Fetch countries on mount (unchanged)
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setCountryList([]); // or handle error
          return;
        }
        const countries = data.map(country => {
          const name = country.name?.common || '';
          const currencies = country.currencies;
          if (currencies) {
            const currencyObj = Object.values(currencies)[0];
            const currencySymbol = currencyObj?.symbol || '';
            const currencyCode = Object.keys(currencies)[0] || '';
            return { name, symbol: currencySymbol, code: currencyCode };
          }
          return null;
        }).filter(Boolean);
        // Ensure India is present
        if (!countries.some(c => c.name === 'India')) {
          countries.unshift({ name: 'India', symbol: '₹', code: 'INR' });
        }
        setCountryList(countries);
      })
      .catch(() => setCountryList([]));
  }, []);
  // When country changes, update inside/outside India
  useEffect(() => {
    if (selectedCountry.symbol !== '₹') {
      setShowInsideIndia(false);
    } else {
      setShowInsideIndia(true);
    }
  }, [selectedCountry]);
  // Fetch calculation from backend when relevant fields change
  useEffect(() => {
    if (
      baseAmount !== '' &&
      selectedCountry &&
      (selectedCountry.name !== 'India' || selectedState)
    ) {
      calculateInvoice({
        base_amount: baseAmount,
        country: selectedCountry.name,
        state: selectedState,
        total_hours: totalHours,
        rate,
        hns_code: hnsSelect // send as hns_code for clarity
      })
        .then(result => {
          setCalculationResult(result);
        })
        .catch(() => {
          setCalculationResult({});
        });
    }
  }, [baseAmount, selectedCountry, selectedState, totalHours, rate, hnsSelect]);
  // Copy bill to ship
  const copyBillToShip = () => {
    setShipTo({ ...billTo });
  };
  // Country dropdown logic
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setBaseAmount('');
    setCalculationResult({
      cgst: '0.00',
      sgst: '0.00',
      igst: '0.00',
      total_with_gst: '0.00',
      amount_in_words: 'Zero',
      taxable_value: '0.00',
      tax_cgst: '0.00',
      tax_sgst: '0.00',
      all_tax_amount: '0.00',
      total_taxable: '0.00',
      total_tax_cgst: '0.00',
      total_tax_sgst: '0.00',
      total_tax_amount: '0.00',
      total_tax_in_words: 'Zero'
    });
  };
  // const filteredCountries = countryList.filter(c => // This state is removed
  //   c.name.toLowerCase().includes(countrySearch.toLowerCase())
  // );

  const handleDownloadPDF = () => {
    const element = document.querySelector('.main-box');
    const opt = {
      margin: 0.2,
      filename: `TaxInvoice_${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Fetch next invoice number from backend
  const fetchNextInvoiceNumber = async () => {
    setLoadingInvoiceNumber(true);
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    try {
      const res = await fetch('http://localhost:8000/api/get_next_invoice_number/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoiceNumber(data.invoice_number);
        setFinancialYear(data.financial_year);
      } else {
        setInvoiceNumber('');
        setFinancialYear('');
      }
    } catch (e) {
      setInvoiceNumber('');
      setFinancialYear('');
    } finally {
      setLoadingInvoiceNumber(false);
    }
  };

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);

  // Render
  const indiaStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];
  const showStateSelect = selectedCountry.name === 'India';

  useEffect(() => {
    if (selectedCountry.name === 'India' && !selectedState) {
      setSelectedState('Gujarat');
    }
    if (selectedCountry.name !== 'India') {
      setSelectedState('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    const hours = parseFloat(totalHours);
    const r = parseFloat(rate);
    if (!isNaN(hours) && !isNaN(r) && totalHours !== '' && rate !== '') {
      setBaseAmount(hours * r);
    }
  }, [totalHours, rate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Remove the previous top bar */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <div className='container'>
          {/* Header bar inside container */}
          <div className='headrmain' >
            <button onClick={() => window.history.back()} style={{ padding: '8px 18px', fontSize: '16px', borderRadius: '6px', border: '1px solid #888', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600 }}>Back</button>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>New Tax Invoice</h1>
          </div>
          {/* Show invoice number at the top */}
          <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
            Invoice Number: {loadingInvoiceNumber ? 'Loading...' : (invoiceNumber || 'Not available')}
          </div>
          <div className="taxinvoices-content-inner">

            {/* start form */}
            {/* <div className="row">
              <div className="col-xs-12 text-center">
                <h2 style={{ fontWeight: 'bold' }}>TAX INVOICE </h2>
              </div>
            </div> */}
            <div className="table-bordered main-box" style={{ border: "2px solid rgb(97, 94, 94)" }}>
              <div className=" date-tables">
                {/* Left side - Grabsolve, Buyer, Consignee */}
                <div className="col-6">
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background"><strong style={{ fontSize: '15px' }}>{settings?.company_name}</strong></td>
                      </tr>
                      <tr>
                        <td>
                          {settings?.seller_address}<br />
                          GSTIN/UIN: {settings?.seller_gstin} <br />
                          Email: {settings?.seller_email}<br />
                          PAN: {settings?.seller_pan}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background"><strong>Buyer (Bill to):</strong></td>
                      </tr>
                      <tr>
                        <td>
                          Title:<input name="billToTitle" type="text" className="billToTitle" style={{ marginBottom: '5px' }} value={billTo.title} onChange={e => setBillTo({ ...billTo, title: e.target.value })} />
                          Address:<textarea name="billToAddress" className="billToAddress" style={{ width: '100%', height: '100px' }} value={billTo.address} onChange={e => setBillTo({ ...billTo, address: e.target.value })}></textarea>
                          GSTIN/UIN: <input name="billToGST" type="text" className="billToGST" value={billTo.gst} onChange={e => setBillTo({ ...billTo, gst: e.target.value })} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background"><strong>Consignee (Ship to):</strong><button style={{ float: 'right' }} className="copybutton" type="button" onClick={copyBillToShip}>Copy</button></td>
                      </tr>
                      <tr>
                        <td>
                          Title:<input name="shipToTitle" type="text" className="shipToTitle" style={{ marginBottom: '5px' }} value={shipTo.title} onChange={e => setShipTo({ ...shipTo, title: e.target.value })} />
                          Address:<textarea name="shipToAddress" className="shipToAddress" style={{ width: '100%', height: '100px' }} value={shipTo.address} onChange={e => setShipTo({ ...shipTo, address: e.target.value })}></textarea>
                          GSTIN/UIN: <input name="shipToGST" type="text" className="shipToGST" value={shipTo.gst} onChange={e => setShipTo({ ...shipTo, gst: e.target.value })} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Right side - Invoice details */}
                <div className="col-6" style={{ paddingLeft: "10px", paddingRight: "0px" }}>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td>Invoice No.</td>
                        <td>
                          <input type="text" name="invoiceNumber" value={loadingInvoiceNumber ? 'Loading...' : (invoiceNumber || '')} readOnly />
                        </td>
                      </tr>
                      <tr>
                        <td>Date</td>
                        <td>
                          <input type="date" id="datePicker" value={date} onChange={e => setDate(e.target.value)} />
                        </td>
                      </tr>
                      <tr>
                        <td>Delivery Note</td>
                        <td style={{ width: '250px' }}><input type="text" name="deliveryNote" className="deliveryNote" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td>Mode/Terms of Payment</td>
                        <td style={{ width: '250px' }}><input type="text" name="modeOfPayment" className="modeOfPayment" value={modeOfPayment} onChange={e => setModeOfPayment(e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td>Delivery Note Date</td>
                        <td style={{ width: '250px' }}><input type="text" name="deliveryNoteDate" className="deliveryNoteDate" value={deliveryNoteDate} onChange={e => setDeliveryNoteDate(e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td>Destination</td>
                        <td style={{ width: '250px' }}><input type="text" name="destination" className="destination" value={destination} onChange={e => setDestination(e.target.value)} /></td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background"><strong>Terms to Delivery:</strong></td>
                      </tr>
                      <tr>
                        <td style={{ height: '110px' }}>
                          <textarea name="termsOfDelivery" className="termsOfDelivery" style={{ width: '100%', height: '100%' }} value={termsOfDelivery} onChange={e => setTermsOfDelivery(e.target.value)}></textarea>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className='row'>
                    <div className="col-12">
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label htmlFor="countryCurrency">Country and currency:</label>
                          <div style={{ position: 'relative', minWidth: 0 }}>
                            <div
                              className="dropdown-selected"
                              style={{
                                padding: '10px 15px',
                                border: '1px solid #302f2f',
                                borderRadius: '6px',
                                background: '#fff',
                                fontSize: '16px',
                                color: '#333',
                                cursor: 'pointer'
                              }}
                              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            >
                              {selectedCountry.name} - {selectedCountry.symbol}
                            </div>
                            {countryDropdownOpen && (
                              <div className="custom-country-dropdown-list">
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={countrySearch}
                                  onChange={e => setCountrySearch(e.target.value)}
                                />
                                {countryList
                                  .filter(c =>
                                    c.name.toLowerCase().includes(countrySearch.toLowerCase())
                                  )
                                  .map((country, idx) => (
                                    <div
                                      key={country.name + idx}
                                      className="custom-country-dropdown-option"
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setCountryDropdownOpen(false);
                                        setCountrySearch('');
                                      }}
                                    >
                                      {country.name} - {country.symbol}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          <br />
                          <div className="lut outside-india" style={{ display: showInsideIndia ? 'none' : 'block' }}>
                            <h4>Declare under LUT </h4>
                          </div>
                          <input type="hidden" id="currencyTitle" value={selectedCountry.code} />
                          <input type="hidden" id="currencySymbole" value={selectedCountry.symbol} />
                        </div>
                        <div style={{ flex: 1 }}>
                          {/* State Dropdown - custom like country dropdown */}
                          {showStateSelect && (
                            <div style={{ position: 'relative', minWidth: 0 }}>
                              <label htmlFor="stateSelect">State:</label>
                              <div
                                className="dropdown-selected"
                                style={{
                                  padding: '10px 15px',
                                  border: '1px solid #302f2f',
                                  borderRadius: '6px',
                                  background: '#fff',
                                  fontSize: '16px',
                                  color: '#333',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                              >
                                {selectedState || 'Select State'}
                              </div>
                              {stateDropdownOpen && (
                                <div className="custom-country-dropdown-list">
                                  <input
                                    type="text"
                                    placeholder="Search state..."
                                    value={stateSearch}
                                    onChange={e => setStateSearch(e.target.value)}
                                  />
                                  {indiaStates
                                    .filter(state =>
                                      state.toLowerCase().includes(stateSearch.toLowerCase())
                                    )
                                    .map((state, idx) => (
                                      <div
                                        key={state + idx}
                                        className="custom-country-dropdown-option"
                                        onClick={() => {
                                          setSelectedState(state);
                                          setStateDropdownOpen(false);
                                          setStateSearch('');
                                        }}
                                      >
                                        {state}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* total table */}
              <div className="row">
                <div className="col-xs-12">
                  <table className="table table-bordered black-bordered">
                    <thead>
                      <tr>
                        <th>SI No.</th>
                        <th>Particulars</th>
                        <th>HSN/SAC</th>
                        <th>Hours</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: '111px' }}>
                        <td style={{ textAlign: "center", width: "70px" }}>1</td>
                        <td>
                          <textarea
                            name="gstConsultancy"
                            id="gstConsultancy"
                            value={gstConsultancy}
                            onChange={e => setGstConsultancy(e.target.value)}
                            rows={4} // jitni lines dikhani ho utni rows set karo
                            style={{ width: "100%", resize: "vertical", padding: "8px", height: "46px", marginTop: "8px" }}
                          />
                        </td>
                        <td style={{ width: '130px' }}>
                          <select style={{ height: "46px", margin: "8px 0px" }} name="hns_select" id="hns_select" value={hnsSelect} onChange={e => setHnsSelect(e.target.value)} disabled={formDisabled}>
                            {settings?.HSN_codes?.map((code, idx) => (
                              <option key={idx} value={code}>{code}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ width: '10%' }}><input name="total_hours" id="total_hours" type="number" value={totalHours} onChange={e => { setTotalHours(e.target.value); }} disabled={formDisabled} /></td>
                        <td style={{ width: '10%' }}><input name="rate" id="rate" type="number" value={rate} onChange={e => { setRate(e.target.value); }} disabled={formDisabled} /></td>
                        <td style={{ width: '170px' }}><span className="currency-sym">{selectedCountry.symbol}</span> <input style={{ width: "135px" }} onChange={e => setBaseAmount(e.target.value)} value={baseAmount} id="baseAmount" name="baseAmount" type="number" disabled={formDisabled} /></td>
                      </tr>
                      {/* Show CGST/SGST if Gujarat, IGST if other state in India */}
                      {showInsideIndia && selectedState === 'Gujarat' && <>
                        <tr className="inside-india">
                          <td></td>
                          <td><span style={{ float: 'right' }}>CGST @ 9%</span></td>
                          <td></td>
                          <td></td>
                          <td>9%</td>
                          <td id="cgst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.cgst}</td>
                        </tr>
                        <tr className="inside-india">
                          <td></td>
                          <td><span style={{ float: 'right' }}>SGST @ 9%</span></td>
                          <td></td>
                          <td></td>
                          <td>9%</td>
                          <td id="sgst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.sgst}</td>
                        </tr>
                      </>}
                      {showInsideIndia && selectedState !== 'Gujarat' && <>
                        <tr className="outside-india">
                          <td></td>
                          <td><span style={{ float: 'right' }}>IGST @ 18%</span></td>
                          <td></td>
                          <td></td>
                          <td>18%</td>
                          <td id="igst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.igst}</td>
                        </tr>
                      </>}
                      <tr>
                        <td colSpan="5" className="text-right"><strong>Total</strong></td>
                        <td><strong id="total-with-gst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.total_with_gst}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* amont in words */}
              <div className="row">
                <div className="col-xs-12">
                  <div className="table-bordered black-bordered amount-box">
                    <div>
                      <strong>Amount Chargeable (in words):</strong><br />
                      <p id="total-in-words"><span className="currency-text">{selectedCountry.code}</span> {calculationResult.amount_in_words}</p>
                      <div className="top-right-corner">
                        <span>E. & O.E</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* tax table */}
              <div className="row">
                {showInsideIndia && selectedState === 'Gujarat' && <div className="col-xs-12 inside-india">
                  <table className="table table-bordered invoice-table" style={{ border: '1px solid #000' }}>
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ border: '1px solid #000' }}>HSN/SAC</th>
                        <th rowSpan="2" style={{ border: '1px solid #000' }}>Taxable Value</th>
                        <th colSpan="2" style={{ border: '1px solid #000' }}>Central Tax</th>
                        <th colSpan="2" style={{ border: '1px solid #000' }}>State Tax</th>
                        <th colSpan="2" style={{ border: '1px solid #000' }} rowSpan="2">Total Tax Amount</th>
                      </tr>
                      <tr>
                        <th style={{ border: '1px solid #000' }}>Rate</th>
                        <th style={{ border: '1px solid #000' }}>Amount</th>
                        <th style={{ border: '1px solid #000' }}>Rate</th>
                        <th style={{ border: '1px solid #000' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000' }}><span className="hns_select_text">{hnsSelect}</span></td>
                        <td style={{ border: '1px solid #000' }} id="taxable-value">{calculationResult.taxable_value}</td>
                        <td style={{ border: '1px solid #000' }}>9%</td>
                        <td style={{ border: '1px solid #000' }} id="tax-cgst">{calculationResult.tax_cgst}</td>
                        <td style={{ border: '1px solid #000' }}>9%</td>
                        <td style={{ border: '1px solid #000' }} id="tax-sgst">{calculationResult.tax_sgst}</td>
                        <td style={{ border: '1px solid #000' }} id="all-tax-amount">{calculationResult.all_tax_amount}</td>
                      </tr>
                      <tr className="total-row">
                        <td style={{ border: '1px solid #000' }}>Total</td>
                        <td style={{ border: '1px solid #000' }} id="total-taxable">{calculationResult.total_taxable}</td>
                        <td style={{ border: '1px solid #000' }}></td>
                        <td style={{ border: '1px solid #000' }} id="total-tax-cgst">{calculationResult.total_tax_cgst}</td>
                        <td style={{ border: '1px solid #000' }}></td>
                        <td style={{ border: '1px solid #000' }} id="total-tax-sgst">{calculationResult.total_tax_sgst}</td>
                        <td style={{ border: '1px solid #000' }} id="total-tax-amount">{calculationResult.total_tax_amount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
                {showInsideIndia && selectedState !== 'Gujarat' && <div className="col-xs-12 outside-india">
                  <table className="table table-bordered invoice-table" style={{ border: '1px solid #000' }}>
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ border: '1px solid #000' }}>HSN/SAC</th>
                        <th rowSpan="2" style={{ border: '1px solid #000' }}>Taxable Value</th>
                        <th colSpan="2" style={{ border: '1px solid #000' }}>Integrated Tax</th>
                        <th colSpan="2" style={{ border: '1px solid #000' }} rowSpan="2">Total Tax Amount</th>
                      </tr>
                      <tr>
                        <th>IGST Rate</th>
                        <th>IGST Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="hns_select_text">{hnsSelect}</span></td>
                        <td id="taxable-value">{calculationResult.taxable_value}</td>
                        <td>18%</td>
                        <td id="igst">{calculationResult.igst}</td>
                        <td id="all-tax-amount">{calculationResult.all_tax_amount}</td>
                      </tr>
                      <tr className="total-row">
                        <td>Total</td>
                        <td id="total-taxable">{calculationResult.total_taxable}</td>
                        <td></td>
                        <td id="total-tax-igst">{calculationResult.igst}</td>
                        <td id="total-tax-amount">{calculationResult.total_tax_amount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
                <div>
                  {!showInsideIndia && <div className="col-xs-12 outside-india">
                    <div>
                      <strong>Tax Amount (in words):</strong>
                      <span id="total-tax-in-words"><span className='currency-text'>{selectedCountry.code}</span> {calculationResult.total_tax_in_words}</span>
                    </div>
                  </div>}
                  <div className="col-xs-12">
                    <div>
                      <h5 style={{ marginBottom: "3px" }}><strong>Remarks:</strong></h5>
                      <input name="remark" type="text" className="remark" style={{ width: '550px', height: "50px" }} value={remark} onChange={e => setRemark(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
             
              {/* footer */}
              <div className="row">
                <div className="col-xs-12">
                  <hr style={{ border: 'none', borderTop: '2px solid #000' }} />
                  <div className="hr">
                    <strong>Company's Bank Details</strong><br />
                    {settings && (
                      <>
                        A/c Holder's Name: {settings.bank_account_holder}<br />
                        Bank Name: {settings.bank_name}<br />
                        A/c No.: {settings.account_number}<br />
                        IFS Code: {settings.ifsc_code}<br />
                        Branch: {settings.branch}<br />
                        SWIFT Code: {settings.swift_code}
                      </>
                    )}
                  </div>
                  <div className="text-right signatory">
                    <img src={settings?.logo_url || '/logo.png'} className="logo-image" alt="Logo" />
                    <p>for {settings?.company_name}</p>
                    <p>Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-12 text-center">
                <p>This is a Computer Generated Invoice</p>
              </div>
            </div>
            {/* end form */}

            <div className="row">
              <div className="col-xs-12 text-center">
                <button
                  className="download-btn"
                  disabled={loadingInvoiceNumber || !invoiceNumber}
                  onClick={async () => {
                    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
                    const parseNumber = v => v === '' || v == null ? 0 : Number(v);
                    const parseDate = v => v ? new Date(v).toISOString().split('T')[0] : null;
                    if (!invoiceNumber) {
                      alert('Invoice number is not loaded yet. Please wait.');
                      return;
                    }
                    const invoiceData = {
                      buyer_name: billTo.title,
                      buyer_address: billTo.address,
                      buyer_gst: billTo.gst || '',
                      consignee_name: shipTo.title || '',
                      consignee_address: shipTo.address || '',
                      consignee_gst: shipTo.gst || '',
                      financial_year: financialYear || '2025-2026',
                      invoice_number: invoiceNumber,
                      invoice_date: parseDate(date),
                      delivery_note: deliveryNote || '',
                      payment_mode: modeOfPayment || '',
                      delivery_note_date: parseDate(deliveryNoteDate),
                      destination: destination || '',
                      terms_to_delivery: termsOfDelivery || '',
                      country: selectedCountry.name,
                      currency: selectedCountry.code,
                      currency_symbol: selectedCountry.symbol,
                      state: selectedState,
                      particulars: gstConsultancy || '',
                      total_hours: parseNumber(totalHours),
                      rate: parseNumber(rate),
                      base_amount: parseNumber(baseAmount),
                      total_amount: parseNumber(calculationResult.total_with_gst),
                      cgst: calculationResult.cgst == null ? 0 : Number(calculationResult.cgst),
                      sgst: calculationResult.sgst == null ? 0 : Number(calculationResult.sgst),
                      igst: calculationResult.igst == null ? 0 : Number(calculationResult.igst),
                      total_with_gst: calculationResult.total_with_gst == null ? 0 : Number(calculationResult.total_with_gst),
                      amount_in_words: calculationResult.amount_in_words || '',
                      taxtotal: calculationResult.taxtotal == null ? 0 : Number(calculationResult.taxtotal),
                      remark: remark || '',
                      exchange_rate: 1,
                      inr_equivalent: calculationResult.inr_equivalent == null ? 0 : Number(calculationResult.inr_equivalent),
                      country_flag: '',
                    };
                    if (!formDisabled) {
                      // First time: save invoice, then lock form and allow further downloads
                      try {
                        await saveInvoice(invoiceData, token);
                        setFormDisabled(true);
                        handleDownloadPDF();
                      } catch (err) {
                        alert('Failed to save invoice: ' + (err.message || err));
                      }
                    } else {
                      // Already saved: just download PDF again
                      handleDownloadPDF();
                    }
                  }}
                >
                  {loadingInvoiceNumber ? 'Loading Invoice Number...' : 'Download PDF'}
                </button>
              </div>
            </div>
            {/* Removed: Hidden HTML for PDF generation */}
            {/* Removed: Download PDF button */}
            {/* Remove the PDF download buttons below */}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Taxinvoices;