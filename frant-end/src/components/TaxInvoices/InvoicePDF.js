import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePDF = ({ invoice, settings, onDownloadComplete }) => {
  const pdfRef = useRef();

  // Helper to format date as dd/mm/yyyy
  function formatDateDMY(dateStr) {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

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
    const rupees = Math.round(num);
    let words = '';
    if (rupees > 0) words += inWords(rupees) + ' Rupees';
    if (words) words += ' Only';
    return words;
  }

  const generatePDF = async () => {
    if (!pdfRef.current) {
      console.error('PDF content not found');
      return;
    }

    const element = pdfRef.current;
    const prevDisplay = element.style.display;
    element.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.display = prevDisplay;

      const imgData = canvas.toDataURL('image/png');
      if (!imgData.startsWith('data:image/png')) {
        throw new Error('Failed to generate a valid PNG image for PDF.');
      }

      const filename = `Invoice_${invoice.invoice_number || 'NoNumber'}_${invoice.invoice_date || ''}.pdf`;
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
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      element.style.display = prevDisplay;
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  useEffect(() => {
    if (invoice && settings) {
      generatePDF();
    }
  }, [invoice, settings]);

  if (!invoice || !settings) {
    return <div>Loading...</div>;
  }

  const isForeign = invoice.country !== 'India';
  const showInsideIndia = !isForeign;
  const selectedState = invoice.state;
  const selectedCountry = {
    name: invoice.country || 'India',
    symbol: invoice.currency_symbol || '₹',
    code: invoice.currency || 'INR'
  };

  return (
    <div
      ref={pdfRef}
      className="pdf invoice-pdf pdf-margine"
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
      <h1 style={{ textAlign: 'center', fontWeight: '700' }}>Tax Invoice</h1>
      
      <div className="table-bordered pdf-main-box" style={{ border: "2px solid rgb(97, 94, 94)" }}>
        <div className="date-tables">
          {/* Left side - Company, Buyer, Consignee */}
          <div className="col-6">
            <table className="table table-bordered black-bordered">
              <tbody>
                <tr>
                  <td className="gray-background"><strong >{settings.company_name}</strong></td>
                </tr>
                <tr>
                  <td>
                    <div style={{ whiteSpace: 'pre-line' }}>
                      {settings.seller_address}
                    </div>
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
                  <td className="gray-background"><strong>Buyer (Bill to): {invoice.buyer_name}</strong> </td>
                </tr>
                <tr>
                  <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                    <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                      <strong>Address:</strong> <span>{invoice.buyer_address}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="gray-background"><strong>GSTIN/UIN: {invoice.buyer_gst}</strong> </td>
                </tr>
              </tbody>
            </table>
            <table className="table table-bordered black-bordered">
              <tbody>
                <tr>
                  <td className="gray-background"><strong>Consignee (Ship to): {invoice.consignee_name}</strong> </td>
                </tr>
                <tr>
                  <td style={{ minHeight: '100px', height: 'auto', verticalAlign: 'top' }}>
                    <div style={{ minHeight: '100px', whiteSpace: 'pre-line' }}>
                      <strong>Address:</strong> <span>{invoice.consignee_address}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="gray-background"><strong>GSTIN/UIN: {invoice.consignee_gst}</strong> </td>
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
                      width: 'max-content',
                    }}>
                      {selectedCountry.name} - {selectedCountry.symbol}
                    </div>
                    <br />
                    {!showInsideIndia && (
                      <div style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <div>
                          <h4 className="lut outside-indias">Declare under LUT</h4>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          {invoice.exchange_rate
                            ? `1 ${selectedCountry.code} = ${invoice.exchange_rate} INR`
                            : `Exchange rate not available for ${selectedCountry.code}`
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
                    {invoice.particulars}
                  </td>
                  <td style={{ width: '130px' }}>{invoice.hns_code}</td>
                  <td style={{ width: '10%' }}>{invoice.total_hours}</td>
                  <td style={{ width: '10%' }}>{invoice.rate}</td>
                  <td style={{ width: '170px' }}><span className="currency-sym">{selectedCountry.symbol}</span> {invoice.base_amount}</td>
                </tr>
                {/* Show CGST/SGST if Gujarat, IGST if other state in India */}
                {showInsideIndia && selectedState === 'Gujarat' && <>
                  <tr className="inside-india">
                    <td></td>
                    <td><span style={{ float: 'right' }}>CGST @ 9%</span></td>
                    <td></td>
                    <td></td>
                    <td>9%</td>
                    <td id="cgst"><span className="currency-sym">{selectedCountry.symbol}</span> {invoice.cgst}</td>
                  </tr>
                  <tr className="inside-india">
                    <td></td>
                    <td><span style={{ float: 'right' }}>SGST @ 9%</span></td>
                    <td></td>
                    <td></td>
                    <td>9%</td>
                    <td id="sgst"><span className="currency-sym">{selectedCountry.symbol}</span> {invoice.sgst}</td>
                  </tr>
                </>}
                {showInsideIndia && selectedState !== 'Gujarat' && <>
                  <tr className="outside-india">
                    <td></td>
                    <td style={{height:'61.5px'}}><span style={{ float: 'right',paddingTop:'11px', }}>IGST @ 18%</span></td>
                    <td></td>
                    <td></td>
                    <td style={{paddingTop:'17px'}}>18%</td>
                    <td style={{paddingTop:'17px'}} id="igst"><span className="currency-sym">{selectedCountry.symbol}</span> {invoice.igst}</td>
                  </tr>
                </>}
                <tr>
                  <td style={{height:'61.5px',paddingTop:'20px'}} colSpan="5" className="text-right"><strong>Total</strong></td>
                  <td style={{paddingTop:'20px'}}><strong id="total-with-gst"><span className="currency-sym">{selectedCountry.symbol}</span> {invoice.total_with_gst}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* amount in words */}
        <div className="row">
          <div className="col-xs-12">
            {/* Show INR equivalent for non-India countries if exchange rate and total_with_gst are available */}
            {!showInsideIndia && invoice.exchange_rate && invoice.total_with_gst && (() => {
              const inrEquivalentRaw = Number(invoice.total_with_gst) * Number(invoice.exchange_rate);
              const inrEquivalent = Math.round(inrEquivalentRaw);
              return (
                <>
                  {/* INR equivalent in numbers */}
                  <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                    <span style={{ width: '100%', fontSize: '15px' }}>
                      <strong>Converted INR Equivalent:</strong> ₹ {inrEquivalent.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* INR equivalent in words */}
                  <div className="table-bordered black-bordered amount-box" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', height: '70px' }}>
                    <span style={{ width: '100%', fontSize: '15px' }}>
                      <strong>Converted INR (in words):</strong> {inrAmountInWords(inrEquivalent)}
                    </span>
                  </div>
                </>
              );
            })()}
            <div className="table-bordered black-bordered amount-box" style={!showInsideIndia ? { height: '100px',fontSize:"20px", paddingTop:'20px' } : {}}>
              <div>
                <strong>Total Amount (in words):</strong><br />
                <p id="total-in-words"><span className="currency-text">{selectedCountry.code}</span> {invoice.amount_in_words}</p>
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
                  <td style={{ border: '1px solid #000' }}><span className="hns_select_text">{invoice.hns_code}</span></td>
                  <td style={{ border: '1px solid #000' }} id="taxable-value">
                    {selectedCountry.symbol}{invoice.base_amount}
                  </td>
                  <td style={{ border: '1px solid #000' }}>9%</td>
                  <td style={{ border: '1px solid #000' }} id="tax-cgst">{selectedCountry.symbol}{invoice.cgst}</td>
                  <td style={{ border: '1px solid #000' }}>9%</td>
                  <td style={{ border: '1px solid #000' }} id="tax-sgst">{selectedCountry.symbol}{invoice.sgst}</td>
                  <td style={{ border: '1px solid #000' }} id="all-tax-amount">{selectedCountry.symbol}{invoice.total_tax_amount}</td>
                </tr>
                <tr className="total-row">
                  <td style={{ border: '1px solid #000' }}>Total</td>
                  <td style={{ border: '1px solid #000' }} id="total-taxable">
                    {selectedCountry.symbol}{invoice.base_amount}
                  </td>
                  <td style={{ border: '1px solid #000' }}></td>
                  <td style={{ border: '1px solid #000' }} id="total-tax-cgst">{selectedCountry.symbol}{invoice.cgst}</td>
                  <td style={{ border: '1px solid #000' }}></td>
                  <td style={{ border: '1px solid #000' }} id="total-tax-sgst">{selectedCountry.symbol}{invoice.sgst}</td>
                  <td style={{ border: '1px solid #000' }} id="total-tax-amount">{selectedCountry.symbol}{invoice.total_tax_amount}</td>
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
                  <td><span className="hns_select_text">{invoice.hns_code}</span></td>
                  <td id="taxable-value">{selectedCountry.symbol}{invoice.base_amount}</td>
                  <td>18%</td>
                  <td id="igst">{selectedCountry.symbol}{invoice.igst}</td>
                  <td id="all-tax-amount">{selectedCountry.symbol}{invoice.total_tax_amount}</td>
                </tr>
                <tr className="total-row">
                  <td>Total</td>
                  <td id="total-taxable">{selectedCountry.symbol}{invoice.base_amount}</td>
                  <td></td>
                  <td id="total-tax-igst">{selectedCountry.symbol}{invoice.igst}</td>
                  <td id="total-tax-amount">{selectedCountry.symbol}{invoice.total_tax_amount}</td>
                </tr>
              </tbody>
            </table>
          </div>}
          <div>
            {showInsideIndia && <div className="col-xs-12 inside-india">
              <div>
                <strong>Tax Amount (in words):</strong>
                <span id="total-tax-in-words"><span className='currency-text'>{selectedCountry.code}</span> {invoice.total_tax_in_words}</span>
              </div>
            </div>}
            <div className="col-xs-12">
              <div>
                <h5 style={{ marginBottom: "3px" }}><strong>Remarks:</strong></h5>
                <span>{invoice.remark}</span>
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
  );
};

export default InvoicePDF; 