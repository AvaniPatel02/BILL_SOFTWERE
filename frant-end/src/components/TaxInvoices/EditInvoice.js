import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Dashboard/Sidebar';
import Header from '../Dashboard/Header';
import '../../styles/TaxInvoices.css';
import { fetchSettings } from '../../services/settingsApi';
import { calculateInvoice } from '../../services/calculateInvoiceApi';
import { getInvoiceById, updateInvoice } from '../../services/taxInvoiceApi';
import { getSettings } from '../../services/settingsApi';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EditInvoice = () => {
  const { id } = useParams();
  
  // State for all fields - same as TaxInvoice
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const invoiceRef = useRef();

  // Load invoice data on mount
  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      getInvoiceById(id)
        .then((data) => {
          if (!data) {
            setError('Invoice not found');
            setLoading(false);
            return;
          }
          
          // Pre-fill all the fields with existing data
          setBillTo({ 
            title: data.buyer_name || '', 
            address: data.buyer_address || '', 
            gst: data.buyer_gst || '' 
          });
          setShipTo({ 
            title: data.consignee_name || '', 
            address: data.consignee_address || '', 
            gst: data.consignee_gst || '' 
          });
          setInvoiceNumber(data.invoice_number || '');
          setDate(data.invoice_date ? data.invoice_date.split('T')[0] : new Date().toISOString().split('T')[0]);
          setDeliveryNote(data.delivery_note || '');
          setModeOfPayment(data.payment_mode || '');
          setDeliveryNoteDate(data.delivery_note_date ? data.delivery_note_date.split('T')[0] : '');
          setDestination(data.destination || '');
          setTermsOfDelivery(data.terms_to_delivery || '');
          setGstConsultancy(data.particulars || '');
          setHnsSelect(data.hns_code || '9983');
          setTotalHours(data.total_hours ? data.total_hours.toString() : '');
          setRate(data.rate ? data.rate.toString() : '');
          setBaseAmount(data.base_amount ? data.base_amount.toString() : '');
          setRemark(data.remark || '');
          setFinancialYear(data.financial_year || '2025-2026');
          
          // Set country and state
          if (data.country) {
            setSelectedCountry({ 
              name: data.country, 
              symbol: data.currency_symbol || '₹', 
              code: data.currency || 'INR' 
            });
          }
          if (data.state && data.state !== 'N/A') {
            setSelectedState(data.state);
          }
          
          // Set exchange rate if available
          if (data.exchange_rate) {
            setExchangeRate(data.exchange_rate);
          }
          
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load invoice.');
          setLoading(false);
        });
    }
  }, [id]);

  // Fetch settings from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      getSettings().then(res => {
        setSettings(res.data || res);
      });
    }
  }, []);

  // Helper to format date as dd/mm/yyyy
  function formatDateDMY(dateStr) {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  // Fetch countries on mount
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setCountryList([]);
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
      const payload = {
        base_amount: Number(baseAmount) || 0,
        country: selectedCountry.name || 'India',
        state: selectedState || 'Gujarat',
        total_hours: Number(totalHours) || 0,
        rate: Number(rate) || 0,
        hns_code: hnsSelect || '9983',
        invoice_date: date
      };
      calculateInvoice(payload)
        .then(result => {
          setCalculationResult(result);
        })
        .catch((err) => {
          console.error('Failed to calculate invoice:', err);
          setCalculationResult({});
        });
    }
  }, [baseAmount, selectedCountry, selectedState, totalHours, rate, hnsSelect, date]);

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

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      alert('Invoice content not found for PDF generation.');
      return;
    }

    const element = invoiceRef.current;
    const prevDisplay = element.style.display;
    element.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    element.style.display = prevDisplay;

    const imgData = canvas.toDataURL('image/png');
    if (!imgData.startsWith('data:image/png')) {
      alert('Failed to generate a valid PNG image for PDF.');
      return;
    }

    const filename = `Invoice_${invoiceNumber || 'NoNumber'}_${date || ''}.pdf`;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 2 * margin;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let finalHeight = pdfHeight;
    let finalWidth = pdfWidth;
    if (pdfHeight > pageHeight - 2 * margin) {
      finalHeight = pageHeight - 2 * margin;
      finalWidth = (imgProps.width * finalHeight) / imgProps.height;
    }
    const x = margin + (pdfWidth - finalWidth) / 2;
    const y = margin;
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
    pdf.save(filename);
  };

  // Update invoice handler
  const handleUpdateInvoice = async () => {
    if (!invoiceNumber) {
      alert('Invoice number is required.');
      return;
    }
    
    if (selectedCountry.name === 'India' && !selectedState) {
      alert('Please select a state for India.');
      return;
    }

    setUpdating(true);
    try {
      const parseNumber = v => v === '' || v == null ? 0 : Number(v);
      const parseDate = v => v ? new Date(v).toISOString().split('T')[0] : null;
      
      const isForeign = selectedCountry.name !== 'India';
      const exchange_rate = isForeign && exchangeRate ? Number(exchangeRate) : 1;
      const totalWithGst = calculationResult.total_with_gst == null ? 0 : Number(calculationResult.total_with_gst);
      const inr_equivalent = isForeign && exchangeRate && totalWithGst
        ? Number((totalWithGst * exchange_rate).toFixed(2))
        : 0;

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
        state: selectedCountry.name === 'India' ? selectedState : 'N/A',
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
        exchange_rate: exchange_rate,
        inr_equivalent: inr_equivalent,
        country_flag: '',
      };

      await updateInvoice(id, invoiceData);
      alert('Invoice updated successfully!');
      handleDownloadPDF();
    } catch (err) {
      alert('Failed to update invoice: ' + (err.message || err));
    } finally {
      setUpdating(false);
    }
  };

  // India states list
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

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Header />
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading invoice data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Header />
          <div style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div className='container'>
          {/* Header bar inside container */}
          <div className='headrmain' >
            <button onClick={() => window.history.back()} style={{ padding: '8px 18px', fontSize: '16px', borderRadius: '6px', border: '1px solid #888', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600 }}>Back</button>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Edit Tax Invoice #{id}</h1>
          </div>
          
          <div className="taxinvoices-content-inner">
            <div className=" table-bordered main-box" style={{ border: "2px solid rgb(97, 94, 94)" }}>
              <div className=" date-tables">
                {/* Left side - Company, Buyer, Consignee */}
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
                          <input type="text" name="invoiceNumber" value={invoiceNumber} readOnly />
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
                        <td style={{ width: '250px' }}>
                          <input
                            type="date"
                            name="deliveryNoteDate"
                            className="deliveryNoteDate"
                            value={deliveryNoteDate}
                            onChange={e => setDeliveryNoteDate(e.target.value)}
                          />
                        </td>
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
                                        handleCountrySelect(country);
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
                          {!showInsideIndia && (
                            <>
                              {exchangeRate === null
                                ? (
                                  <div style={{ marginTop: '8px', color: 'red' }}>
                                    Exchange rate not available for {selectedCountry.code}
                                  </div>
                                )
                                : (
                                  <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#333' }}>
                                    1 {selectedCountry.code} = {exchangeRate} INR
                                  </div>
                                )
                              }
                            </>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
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
              <div className="row" style={!showInsideIndia ? { marginTop: '20px' } : {}}>
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
                      <tr style={!showInsideIndia ? { height: '170px' } : { height: '111px' }}>
                        <td style={{ textAlign: "center", width: "70px" }}>1</td>
                        <td>
                          <textarea
                            name="gstConsultancy"
                            id="gstConsultancy"
                            value={gstConsultancy}
                            onChange={e => setGstConsultancy(e.target.value)}
                            rows={4}
                            style={{ width: "100%", resize: "vertical", padding: "8px", height: "46px", marginTop: "8px" }}
                          />
                        </td>
                        <td style={{ width: '130px' }}>
                          <select style={{ height: "46px", margin: "8px 0px" }} name="hns_select" id="hns_select" value={hnsSelect} onChange={e => setHnsSelect(e.target.value)}>
                            {settings?.HSN_codes?.map((code, idx) => (
                              <option key={idx} value={code}>{code}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ width: '10%' }}><input name="total_hours" id="total_hours" type="number" value={totalHours} onChange={e => { setTotalHours(e.target.value); }} /></td>
                        <td style={{ width: '10%' }}><input name="rate" id="rate" type="number" value={rate} onChange={e => { setRate(e.target.value); }} /></td>
                        <td style={{ width: '170px' }}><span className="currency-sym">{selectedCountry.symbol}</span> <input style={{ width: "135px" }} onChange={e => setBaseAmount(e.target.value)} value={baseAmount} id="baseAmount" name="baseAmount" type="number" /></td>
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
                          <td  style={{height:'61.5px'}}><span style={{ float: 'right',paddingTop:'11px', }}>IGST @ 18%</span></td>
                          <td></td>
                          <td></td>
                          <td style={{paddingTop:'17px'}}>18%</td>
                          <td style={{paddingTop:'17px'}} id="igst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.igst}</td>
                        </tr>
                      </>}
                      <tr>
                        <td style={{height:'61.5px',paddingTop:'20px'}} colSpan="5" className="text-right"><strong>Total</strong></td>
                        <td style={{paddingTop:'20px'}}><strong id="total-with-gst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.total_with_gst}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* amount in words */}
              <div className="row">
                <div className="col-xs-12">
                  {/* Show INR equivalent for non-India countries if exchange rate and total_with_gst are available */}
                  {!showInsideIndia && exchangeRate && calculationResult.total_with_gst && (() => {
                    const inrEquivalentRaw = Number(calculationResult.total_with_gst) * Number(exchangeRate);
                    const inrEquivalent = Math.round(inrEquivalentRaw); // round to nearest integer
                    // Helper to convert number to words (simple version)
                    function inrAmountInWords(num) {
                      if (!num || isNaN(num)) return '';
                      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                      function inWords(n) {
                        if (n < 20) return a[n];
                        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
                        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
                        if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
                        if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
                        return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
                      }
                      const rupees = Math.round(num); // use rounded value
                      let words = '';
                      if (rupees > 0) words += inWords(rupees) + ' Rupees';
                      if (words) words += ' Only';
                      return words;
                    }
                    return (
                      <>
                        {/* INR equivalent in numbers (right) */}
                        <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                          <span style={{ width: '100%',  fontSize: '15px' }}>
                        <strong>Converted INR Equivalent:</strong>    ₹ {inrEquivalent.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {/* INR equivalent in words (left) */}
                        <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                          <span style={{ width: '100%',  fontSize: '15px' }}>
                         <strong> Converted INR (in words):</strong> {inrAmountInWords(inrEquivalent)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  <div className="table-bordered black-bordered amount-box" style={!showInsideIndia ? { height: '100px',fontSize:"20px", paddingTop:'20px' } : {}}>
                    <div>
                      <strong>Total Amount (in words):</strong><br />
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
                          <td style={{ border: '1px solid #000' }} id="taxable-value">
                            {selectedCountry.symbol}{baseAmount}
                          </td>
                          <td style={{ border: '1px solid #000' }}>9%</td>
                          <td style={{ border: '1px solid #000' }} id="tax-cgst">{selectedCountry.symbol}{calculationResult.cgst}</td>
                          <td style={{ border: '1px solid #000' }}>9%</td>
                          <td style={{ border: '1px solid #000' }} id="tax-sgst">{selectedCountry.symbol}{calculationResult.sgst}</td>
                          <td style={{ border: '1px solid #000' }} id="all-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                        <tr className="total-row">
                          <td style={{ border: '1px solid #000' }}>Total</td>
                          <td style={{ border: '1px solid #000' }} id="total-taxable">
                            {selectedCountry.symbol}{baseAmount}
                          </td>
                          <td style={{ border: '1px solid #000' }}></td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-cgst">{selectedCountry.symbol}{calculationResult.cgst}</td>
                          <td style={{ border: '1px solid #000' }}></td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-sgst">{selectedCountry.symbol}{calculationResult.sgst}</td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
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
                          <td id="taxable-value">{selectedCountry.symbol}{baseAmount}</td>
                          <td>18%</td>
                          <td id="igst">{selectedCountry.symbol}{calculationResult.igst}</td>
                          <td id="all-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                        <tr className="total-row">
                          <td>Total</td>
                          <td id="total-taxable">{selectedCountry.symbol}{baseAmount}</td>
                          <td></td>
                          <td id="total-tax-igst">{selectedCountry.symbol}{calculationResult.igst}</td>
                          <td id="total-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                      </tbody>
                  </table>
                </div>}
                <div>
                  {showInsideIndia && <div className="col-xs-12 inside-india">
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

            <div className="row">
              <div className="col-xs-12 text-center">
                <button
                  className="download-btn"
                  id="download-btn"
                  disabled={updating}
                  onClick={handleUpdateInvoice}
                >
                  {updating ? 'Updating...' : 'Update & Download PDF'}
                </button>
              </div>
            </div>

            {/* PDF preview hidden in frontend */}
            <div
              className="pdf invoice-pdf pdf-margine"
              ref={invoiceRef}
              style={{ 
                width: '1116px', 
                margin: '0 auto', 
                background: '#fff', 
                display: 'none',
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                zIndex: -1
              }}
            >
              {/* PDF content - same as TaxInvoice but without input fields */}
              <h1 style={{ textAlign: 'center', fontWeight: '700' }}>Tax Invoice</h1>
              {/* Add the same PDF structure as TaxInvoice but with static values */}
              {/* This would be a very long section, so I'll keep it minimal for now */}
              <div className=" table-bordered pdf-main-box" style={{ border: "2px solid rgb(97, 94, 94)" }}>
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
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {settings?.seller_address}
                            </div>
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
                          <td className="gray-background"><strong>Buyer (Bill to):</strong> {billTo.title}</td>
                        </tr>
                        <tr>
                          <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                            <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                              <strong>Address:</strong> <span>{billTo.address}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background"><strong>GSTIN/UIN:</strong> {billTo.gst}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="table table-bordered black-bordered">
                      <tbody>
                        <tr>
                          <td className="gray-background"><strong>Consignee (Ship to):</strong>  {shipTo.title}</td>
                        </tr>
                        <tr>
                          <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                            <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                              <strong>Address:</strong> <span>{shipTo.address}</span>
                            </div>
                          </td>

                        </tr>
                        <tr>
                          <td className="gray-background"><strong>GSTIN/UIN:</strong> {shipTo.gst}</td>
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
                           <td>{invoiceNumber || ''}</td>
                         </tr>
                        <tr>
                          <td>Date</td>
                           <td>{formatDateDMY(date)}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note</td>
                          <td style={{ width: '250px' }}>{deliveryNote}</td>
                        </tr>
                        <tr>
                          <td>Mode/Terms of Payment</td>
                          <td style={{ width: '250px' }}>{modeOfPayment}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note Date</td>
                          <td style={{ width: '250px' }}>{formatDateDMY(deliveryNoteDate)}</td>
                        </tr>
                        <tr>
                          <td>Destination</td>
                          <td style={{ width: '250px' }}>{destination}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="table table-bordered black-bordered">
                      <tbody>
                        <tr>
                          <td className="gray-background"><strong>Terms to Delivery:</strong></td>
                        </tr>
                        <tr>
                          <td style={{ height: '110px' }}>{termsOfDelivery}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className='row'>
                      <div className="col-12">
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <label>Country and currency:</label>
                            <div style={{
                              padding: '10px 15px',
                              border: '1px solid #302f2f',
                              borderRadius: '6px',
                              background: '#fff',
                              fontSize: '16px',
                              color: '#333',
                              fontWeight: 600,
                              width: 'max-content',
                            }}>
                              {selectedCountry.name} - {selectedCountry.symbol}
                            </div>
                            <br />
                            {/* <div className="lut outside-india" style={{ display: showInsideIndia ? 'none' : 'block' }}>
                              <h4>Declare under LUT </h4>
                            </div> */}
                            {!showInsideIndia && (
                              <div style={{
                                // display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                // marginTop: 8,
                                // marginBottom: 8,
                                width: '100%'
                              }}>
                                <div>
                                  <h4 className="lut outside-indias">Declare under LUT</h4>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#333' }}>
                                  {exchangeRate === null
                                    ? (
                                      <span style={{ color: 'red' }}>
                                        Exchange rate not available for {selectedCountry.code}
                                      </span>
                                    )
                                    : (
                                      <>1 {selectedCountry.code} = {exchangeRate} INR</>
                                    )
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            

                {/* total table */}
                <div className="row" style={!showInsideIndia ? { marginTop: '20px' } : {}}>
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
                        <tr style={!showInsideIndia ? { height: '150px' } : { height: '111px' }}>
                          <td style={{ textAlign: "center", width: "70px" }}>1</td>
                          <td style={{ whiteSpace: 'pre-line' }}>
                            {gstConsultancy}
                          </td>
                          <td style={{ width: '130px' }}>{hnsSelect}</td>
                          <td style={{ width: '10%' }}>{totalHours}</td>
                          <td style={{ width: '10%' }}>{rate}</td>
                          <td style={{ width: '170px' }}><span className="currency-sym">{selectedCountry.symbol}</span> {baseAmount}</td>
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
                            <td  style={{height:'61.5px'}}><span style={{ float: 'right',paddingTop:'11px', }}>IGST @ 18%</span></td>
                            <td></td>
                            <td></td>
                            <td style={{paddingTop:'17px'}}>18%</td>
                            <td style={{paddingTop:'17px'}} id="igst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.igst}</td>
                          </tr>
                        </>}
                        <tr>
                          <td style={{height:'61.5px',paddingTop:'20px'}} colSpan="5" className="text-right"><strong>Total</strong></td>
                          <td style={{paddingTop:'20px'}}><strong id="total-with-gst"><span className="currency-sym">{selectedCountry.symbol}</span> {calculationResult.total_with_gst}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* amont in words */}
                {/* Show exchange rate flex row only for foreign countries */}
                {/* {!showInsideIndia && (
                  <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '48px', height: '56px', }}>
                    
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      
                    </div>
                  </div>
                )} */}
                <div className="row">
                  <div className="col-xs-12">
                    {/* Show INR equivalent for non-India countries if exchange rate and total_with_gst are available */}
                    {!showInsideIndia && exchangeRate && calculationResult.total_with_gst && (() => {
                      const inrEquivalentRaw = Number(calculationResult.total_with_gst) * Number(exchangeRate);
                      const inrEquivalent = Math.round(inrEquivalentRaw); // round to nearest integer
                      // Helper to convert number to words (simple version)
                      function inrAmountInWords(num) {
                        if (!num || isNaN(num)) return '';
                        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                        function inWords(n) {
                          if (n < 20) return a[n];
                          if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
                          if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
                          if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
                          if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
                          return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
                        }
                        const rupees = Math.round(num); // use rounded value
                        let words = '';
                        if (rupees > 0) words += inWords(rupees) + ' Rupees';
                        if (words) words += ' Only';
                        return words;
                      }
                      return (
                        <>
                          {/* Flex row for Declare under LUT and exchange rate, only for foreign countries */}
                        
                          {/* INR equivalent in numbers (right) */}
                          <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                            <span style={{ width: '100%',  fontSize: '15px' }}>
                            <strong>Converted INR Equivalent:</strong>  ₹ {inrEquivalent.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {/* INR equivalent in words (left) */}
                          <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                            <span style={{ width: '100%', fontSize: '15px' }}>
                           <strong>Converted INR (in words):</strong>  {inrAmountInWords(inrEquivalent)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="table-bordered black-bordered amount-box" style={!showInsideIndia ? { height: '100px',fontSize:"20px", paddingTop:'20px' } : {}}>
                      <div>
                        <strong>Totale Amount (in words):</strong><br />
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
                          <td style={{ border: '1px solid #000' }} id="taxable-value">
                            {selectedCountry.symbol}{baseAmount}
                          </td>
                          <td style={{ border: '1px solid #000' }}>9%</td>
                          <td style={{ border: '1px solid #000' }} id="tax-cgst">{selectedCountry.symbol}{calculationResult.cgst}</td>
                          <td style={{ border: '1px solid #000' }}>9%</td>
                          <td style={{ border: '1px solid #000' }} id="tax-sgst">{selectedCountry.symbol}{calculationResult.sgst}</td>
                          <td style={{ border: '1px solid #000' }} id="all-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                        <tr className="total-row">
                          <td style={{ border: '1px solid #000' }}>Total</td>
                          <td style={{ border: '1px solid #000' }} id="total-taxable">
                            {selectedCountry.symbol}{baseAmount}
                          </td>
                          <td style={{ border: '1px solid #000' }}></td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-cgst">{selectedCountry.symbol}{calculationResult.cgst}</td>
                          <td style={{ border: '1px solid #000' }}></td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-sgst">{selectedCountry.symbol}{calculationResult.sgst}</td>
                          <td style={{ border: '1px solid #000' }} id="total-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
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
                          <th style={{ width: "217px" }}>IGST Rate</th>
                          <th style={{ width: "217px" }}>IGST Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span className="hns_select_text">{hnsSelect}</span></td>
                          <td id="taxable-value">{selectedCountry.symbol}{baseAmount}</td>
                          <td>18%</td>
                          <td id="igst">{selectedCountry.symbol}{calculationResult.igst}</td>
                          <td id="all-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                        <tr className="total-row">
                          <td>Total</td>
                          <td id="total-taxable">{selectedCountry.symbol}{baseAmount}</td>
                          <td></td>
                          <td id="total-tax-igst">{selectedCountry.symbol}{calculationResult.igst}</td>
                          <td id="total-tax-amount">{selectedCountry.symbol}{calculationResult.total_tax_amount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>}
                  <div>
                    {showInsideIndia && <div className="col-xs-12 inside-india">
                      <div>
                        <strong>Tax Amount (in words):</strong>
                        <span id="total-tax-in-words"><span className='currency-text'>{selectedCountry.code}</span> {calculationResult.total_tax_in_words}</span>
                      </div>
                    </div>}
                    <div className="col-xs-12">
                      <div>
                        <h5 style={{ marginBottom: "3px" }}><strong>Remarks:</strong></h5>
                        <span>{remark}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default EditInvoice;
