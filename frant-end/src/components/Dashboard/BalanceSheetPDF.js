import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../../styles/balancesheet.css';

const BalanceSheetPDF = ({ sheet, financialYear, onDownloadComplete }) => {
  const pdfRef = useRef();

  useEffect(() => {
    if (pdfRef.current) {
      generatePDF();
    }
  }, [sheet]);

  const generatePDF = async () => {
    try {
      const element = pdfRef.current;
      const prevDisplay = element.style.display;
      element.style.display = 'block';
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true
      });

      element.style.display = prevDisplay;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const imgProps = pdf.getImageProperties(imgData);
      
      // Calculate dimensions to fit the page
      const pdfWidth = pageWidth - 2 * margin;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let finalHeight = pdfHeight;
      let finalWidth = pdfWidth;
      
      // If height exceeds available space, scale down
      if (pdfHeight > pageHeight - 2 * margin) {
        finalHeight = pageHeight - 2 * margin;
        finalWidth = (imgProps.width * finalHeight) / imgProps.height;
      }
      
      // Center horizontally, start at margin from top
      const x = margin + (pdfWidth - finalWidth) / 2;
      const y = margin;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save(`BalanceSheet_${financialYear}.pdf`);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Helper function to round decimal values
  const roundAmount = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    return Math.round(num); // This will round 0.5 and above to 1, below 0.5 to 0
  };

  return (
    <div
      ref={pdfRef}
      style={{
        width: '1116px',
        margin: '0 auto',
        background: '#fff',
        padding: '20px',
        display: 'none',
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        zIndex: -1
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontSize: '24px', fontWeight: 'bold' }}>
        Balance Sheet - {financialYear}
      </h2>
      
      {sheet && (
        <div className="balance-sheet-sections">
          {/* Credit Side */}
          <div className="balance-sheet-column">
                         {sheet.capital && sheet.capital.length > 0 && (
               <div className="balance-sheet-box">
                 <h4>Capital</h4>
                 <table><tbody>
                   {sheet.capital.map((item, idx) => (
                     <tr key={item.name + idx}>
                       <td>{roundAmount(item.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{item.partner_name || item.name || item.notice}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.capital.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                       return roundAmount(total);
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
                       <td>{roundAmount(item.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.loan_credit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                       return roundAmount(total);
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
                       <td>{roundAmount(item.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.unsecure_loan_credit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                       return roundAmount(total);
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
                       <td>{roundAmount(entry.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{entry.name}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const creditors = sheet.sundry_debtors_creditors.filter(e => e.type === 'Creditor');
                       const total = creditors.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                       return roundAmount(total);
                     })()}</td>
                     <td style={{ textAlign: 'right' }}>Total</td>
                   </tr>
                 </tbody></table>
               </div>
             )}
                         {/* Dynamic Sections Credit - Each type as separate section */}
             {sheet.dynamic_sections && Object.keys(sheet.dynamic_sections).length > 0 && 
               Object.entries(sheet.dynamic_sections).map(([sectionName, sectionData]) => (
                 sectionData.credit && sectionData.credit.length > 0 && (
                   <div className="balance-sheet-box" key={`credit-${sectionName}`}>
                     <h4>{sectionName} (Credit)</h4>
                     <table><tbody>
                       {sectionData.credit.map((entry, idx) => (
                         <tr key={idx}>
                           <td>{roundAmount(entry[1])}</td>
                           <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                         </tr>
                       ))}
                       <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                         <td>{(() => {
                           const total = sectionData.credit.reduce((sum, entry) => sum + (parseFloat(entry[1]) || 0), 0);
                           return roundAmount(total);
                         })()}</td>
                         <td style={{ textAlign: 'right' }}>Total</td>
                       </tr>
                     </tbody></table>
                   </div>
                 )
               ))
             }
                         {/* Fixed Assets (Credit) - Credit side */}
             {sheet.fixed_assets_credit && sheet.fixed_assets_credit.length > 0 && (
               <div className="balance-sheet-box">
                 <h4>Fixed Assets (Credit)</h4>
                 <table><tbody>
                   {sheet.fixed_assets_credit.map(([name, amt]) => (
                     <tr key={name}><td>{roundAmount(amt)}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.fixed_assets_credit.reduce((sum, [name, amt]) => sum + (parseFloat(amt) || 0), 0);
                       return roundAmount(total);
                     })()}</td>
                     <td style={{ textAlign: 'right' }}>Total</td>
                   </tr>
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
                     <tr key={name}><td>{roundAmount(amt)}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.fixed_assets_debit.reduce((sum, [name, amt]) => sum + (parseFloat(amt) || 0), 0);
                       return roundAmount(total);
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
                       <td>{roundAmount(item.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.loan_debit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                       return roundAmount(total);
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
                       <td>{roundAmount(item.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{item.bank_name || item.name || item.notice}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.unsecure_loan_debit.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                       return roundAmount(total);
                     })()}</td>
                     <td style={{ textAlign: 'right' }}>Total</td>
                   </tr>
                 </tbody></table>
               </div>
             )}
            {/* Combined Expense Section */}
            {(() => {
              const allExpenses = [];
              let totalExpense = 0;
              
              // Add salary expenses
              if (sheet.salary && sheet.salary.length > 0) {
                sheet.salary.forEach(([name, amt]) => {
                  allExpenses.push([name, amt]);
                  totalExpense += parseFloat(amt) || 0;
                });
              }
              
              // Add other expenses from dynamic sections
              if (sheet.dynamic_sections) {
                Object.entries(sheet.dynamic_sections).forEach(([sectionName, sectionData]) => {
                  if (sectionName.toLowerCase() === 'expense' && sectionData.debit && sectionData.debit.length > 0) {
                    sectionData.debit.forEach((entry) => {
                      allExpenses.push([entry[0], entry[1]]);
                      totalExpense += parseFloat(entry[1]) || 0;
                    });
                  }
                });
              }
              
              return allExpenses.length > 0 ? (
                <div className="balance-sheet-box">
                  <h4>Expense</h4>
                  <table><tbody>
                    {allExpenses.map(([name, amt], idx) => (
                      <tr key={`expense-${idx}`}><td>{roundAmount(amt)}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                      <td>Total</td>
                      <td style={{ textAlign: 'right' }}>{roundAmount(totalExpense)}</td>
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
                     <tr key={name}><td>{roundAmount(amt)}</td><td style={{ textAlign: 'right' }}>{name}</td></tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const total = sheet.buyer.reduce((sum, [name, amt]) => sum + (parseFloat(amt) || 0), 0);
                       return roundAmount(total);
                     })()}</td>
                     <td style={{ textAlign: 'right' }}>Total</td>
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
                       <td>{roundAmount(entry.amount)}</td>
                       <td style={{ textAlign: 'right' }}>{entry.name}</td>
                     </tr>
                   ))}
                   <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                     <td>{(() => {
                       const debtors = sheet.sundry_debtors_creditors.filter(e => e.type === 'Debtor');
                       const total = debtors.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                       return roundAmount(total);
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
                           <td>{roundAmount(entry[1])}</td>
                           <td style={{ textAlign: 'right' }}>{entry[0]}</td>
                         </tr>
                       ))}
                       <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                         <td>{(() => {
                           const total = sectionData.debit.reduce((sum, entry) => sum + (parseFloat(entry[1]) || 0), 0);
                           return roundAmount(total);
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
      )}
    </div>
  );
};

export default BalanceSheetPDF;