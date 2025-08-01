import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../../services/clientsApi';
import { getSettings } from '../../services/settingsApi';
import '../../styles/ViewBill.css';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';

const ViewBill = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invoiceData, settingsData] = await Promise.all([
          getInvoice(invoiceId),
          getSettings()
        ]);
        setInvoice(invoiceData);
        setSettings(settingsData.data || settingsData); // handle both {data: ...} and direct
        setError(null);
      } catch (err) {
        setError('Failed to load invoice or settings.');
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="viewbill-layout"><Header /><Sidebar /><div className="viewbill-container"><div>Loading...</div></div></div>
    );
  }
  if (error) {
    return (
      <div className="viewbill-layout"><Header /><Sidebar /><div className="viewbill-container"><div>{error}</div></div></div>
    );
  }
  if (!invoice || !settings) {
    return null;
  }

  // Helper for INR in words (copied from TaxInvoices.js)
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

  // Helper to format date as dd/mm/yyyy (like TaxInvoices.js)
  function formatDateDMY(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  }

  // For backward compatibility with old invoices
  const items = invoice.items || [
    {
      description: invoice.particulars,
      hsn_sac: invoice.hns_code || invoice.hsn_sac,
      quantity: invoice.total_hours,
      rate: invoice.rate,
      amount: invoice.base_amount
    }
  ];

  // Determine if inside India and state for tax table
  const isIndia = (invoice.country || '').toLowerCase() === 'india';
  const isGujarat = isIndia && (invoice.state || '').toLowerCase() === 'gujarat';

  console.log('isIndia:', isIndia);
  console.log('invoice.total_tax_in_words:', invoice.total_tax_in_words);
  console.log('invoice:', invoice);

  return (
    <div className="viewbill-layout">
      <Header />
      <Sidebar />
      <div className="container">
        <div className='headrmain'>
          <button className="viewbill-back-btn" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
          </button>
          <h1 className="viewbill-title">Tax Invoice</h1>
        </div>
        <div className="taxinvoices-content-inner">
          <div className="table-bordered main-box" style={{ border: "2px solid rgb(97, 94, 94)",width:"100%" }}>
            <div className="date-tables">
              {/* Left side - Seller, Buyer, Consignee */}
              <div className="col-6">
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background"><strong style={{ fontSize: '15px' }}>{settings.company_name}</strong></td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ whiteSpace: 'pre-line' }}>{settings.seller_address}</div>
                        GSTIN/UIN: {settings.seller_gstin} <br />
                        Email: {settings.seller_email}<br />
                        PAN: {settings.seller_pan}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background"><strong>Buyer (Bill to):</strong> {invoice.buyer_name}</td>
                    </tr>
                    <tr>
                      <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                        <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                          <strong>Address:</strong> <span>{invoice.buyer_address}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background"><strong>GSTIN/UIN:</strong> {invoice.buyer_gst}</td>
                    </tr>
                  </tbody>
                </table>
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background"><strong>Consignee (Ship to):</strong>  {invoice.consignee_name}</td>
                    </tr>
                    <tr>
                      <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                        <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                          <strong>Address:</strong> <span>{invoice.consignee_address}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background"><strong>GSTIN/UIN:</strong> {invoice.consignee_gst}</td>
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
                      <td>{invoice.invoice_number}</td>
                    </tr>
                    <tr>
                      <td>Date</td>
                      <td>{formatDateDMY(invoice.invoice_date)}</td>
                    </tr>
                    <tr>
                      <td>Delivery Note</td>
                      <td style={{ width: '250px' }}>{invoice.delivery_note}</td>
                    </tr>
                    <tr>
                      <td>Mode/Terms of Payment</td>
                      <td style={{ width: '250px' }}>{invoice.payment_mode}</td>
                    </tr>
                    <tr>
                      <td>Delivery Note Date</td>
                      <td style={{ width: '250px' }}>{formatDateDMY(invoice.delivery_note_date)}</td>
                    </tr>
                    <tr>
                      <td>Destination</td>
                      <td style={{ width: '250px' }}>{invoice.destination}</td>
                    </tr>
                  </tbody>
                </table>
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background"><strong>Terms to Delivery:</strong></td>
                    </tr>
                    <tr>
                      <td style={{ height: '110px' }}>{invoice.terms_to_delivery}</td>
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
                          // width: 'max-content',
                        }}>
                          {invoice.country} - {invoice.currency_symbol || invoice.currency}
                        </div>
                        <br />
                        {(!isIndia) && (
                          <>
                            <div className="lut outside-india">
                              <h4>Declare under LUT </h4>
                            </div>
                            {invoice.exchange_rate && (
                              <div style={{ fontWeight: 'bold', color: '#333', marginTop: 8 }}>
                                1 {invoice.currency || ''} = {invoice.exchange_rate} INR
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {isIndia && (
                        <div style={{ flex: 1 }}>
                          <label>State:</label>
                          <div style={{
                            padding: '10px 15px',
                            border: '1px solid #302f2f',
                            borderRadius: '6px',
                            background: '#fff',
                            fontSize: '16px',
                            color: '#333',
                            fontWeight: 600
                          }}>
                            {invoice.state}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Items table */}
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
                    {items.map((item, idx) => (
                      <tr key={idx} style={{ height: '111px' }}>
                        <td style={{ textAlign: "center", width: "70px" }}>{idx + 1}</td>
                        <td style={{ whiteSpace: 'pre-line' }}>{item.description}</td>
                        <td style={{ width: '130px' }}>{item.hsn_sac}</td>
                        <td style={{ width: '10%' }}>{item.quantity}</td>
                        <td style={{ width: '10%' }}>{item.rate}</td>
                        <td style={{ width: '170px' }}><span className="currency-sym">{invoice.currency_symbol || invoice.currency}</span> {item.amount}</td>
                      </tr>
                    ))}
                    {/* Show CGST/SGST if Gujarat, IGST if other state in India */}
                    {isIndia && isGujarat && (
                      <>
                        <tr className="inside-india">
                          <td></td>
                          <td><span style={{ float: 'right' }}>CGST @ 9%</span></td>
                          <td></td>
                          <td></td>
                          <td>9%</td>
                          <td><span className="currency-sym">{invoice.currency_symbol || invoice.currency}</span> {invoice.cgst}</td>
                        </tr>
                        <tr className="inside-india">
                          <td></td>
                          <td><span style={{ float: 'right' }}>SGST @ 9%</span></td>
                          <td></td>
                          <td></td>
                          <td>9%</td>
                          <td><span className="currency-sym">{invoice.currency_symbol || invoice.currency}</span> {invoice.sgst}</td>
                        </tr>
                      </>
                    )}
                    {isIndia && !isGujarat && (
                      <tr className="outside-india">
                        <td></td>
                        <td><span style={{ float: 'right' }}>IGST @ 18%</span></td>
                        <td></td>
                        <td></td>
                        <td>18%</td>
                        <td><span className="currency-sym">{invoice.currency_symbol || invoice.currency}</span> {invoice.igst}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="5" className="text-right"><strong>Total</strong></td>
                      <td><strong><span className="currency-sym">{invoice.currency_symbol || invoice.currency}</span> {invoice.total_with_gst}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Amount in words */}
            <div className="row">
              <div className="col-xs-12">
                {/* Show INR equivalent for foreign countries if exchange_rate and total_with_gst are available */}
                {(!isIndia && invoice.exchange_rate && invoice.total_with_gst) ? (() => {
                  const inrEquivalentRaw = Number(invoice.total_with_gst) * Number(invoice.exchange_rate);
                  const inrEquivalent = Math.round(inrEquivalentRaw);
                  return (
                    <>
                      <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                        <span style={{ width: '100%', fontSize: '15px' }}>
                          <strong>Estimated convert INR Equivalent</strong> ₹ {inrEquivalent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                        <span style={{ width: '100%', fontSize: '15px' }}>
                          <strong>Estimated convert INR (in words) :</strong> {inrAmountInWords(inrEquivalent)}
                        </span>
                      </div>
                    </>
                  );
                })() : null}
                <div className="table-bordered black-bordered amount-box">
                  <div>
                    <strong>Amount Chargeable (in words):</strong><br />
                    <p id="total-in-words"><span className="currency-text">{invoice.currency_symbol || invoice.currency}</span> {invoice.amount_in_words || inrAmountInWords(invoice.total_with_gst)}</p>
                    <div className="top-right-corner">
                      <span>E. & O.E</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Tax table */}
            <div className="row">
              {isIndia && isGujarat && (
                <div className="col-xs-12 inside-india">
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
                        <td style={{ border: '1px solid #000' }}>{items[0].hsn_sac}</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.base_amount}</td>
                        <td style={{ border: '1px solid #000' }}>9%</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.cgst}</td>
                        <td style={{ border: '1px solid #000' }}>9%</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.sgst}</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.cgst && invoice.sgst ? (parseFloat(invoice.cgst) + parseFloat(invoice.sgst)).toFixed(2) : ''}</td>
                      </tr>
                      <tr className="total-row">
                        <td style={{ border: '1px solid #000' }}>Total</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.base_amount}</td>
                        <td style={{ border: '1px solid #000' }}></td>
                        <td style={{ border: '1px solid #000' }}>{invoice.cgst}</td>
                        <td style={{ border: '1px solid #000' }}></td>
                        <td style={{ border: '1px solid #000' }}>{invoice.sgst}</td>
                        <td style={{ border: '1px solid #000' }}>{invoice.cgst && invoice.sgst ? (parseFloat(invoice.cgst) + parseFloat(invoice.sgst)).toFixed(2) : ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {isIndia && !isGujarat && (
                <div className="col-xs-12 outside-india">
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
                        <td>{items[0].hsn_sac}</td>
                        <td>{invoice.base_amount}</td>
                        <td>18%</td>
                        <td>{invoice.igst}</td>
                        <td>{invoice.igst}</td>
                      </tr>
                      <tr className="total-row">
                        <td>Total</td>
                        <td>{invoice.base_amount}</td>
                        <td></td>
                        <td>{invoice.igst}</td>
                        <td>{invoice.igst}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {/* Remarks: show above Tax Amount (in words) */}
              {invoice.remark && (
                <div className="col-xs-12">
                  <div>
                    <h5 style={{ marginBottom: "3px" }}><strong>Remarks:</strong></h5>
                    <span>{invoice.remark}</span>
                  </div>
                </div>
              )}
              {/* Tax Amount (in words) for India invoices */}
              {isIndia && invoice.total_tax_in_words && (
                <div className="col-xs-12 inside-india">
                  <div>
                    <strong>Tax Amount (in words):</strong>
                    <span id="total-tax-in-words"><span className='currency-text'>{invoice.currency_symbol || invoice.currency || 'INR'}</span> {invoice.total_tax_in_words}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Footer - Bank details and signature */}
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
                  <img src={settings.logo_url || '/logo.png'} className="logo-image" alt="Logo" />
                  <p>for {settings.company_name}</p>
                  <p>Authorized Signatory</p>
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
  );
};

export default ViewBill; 