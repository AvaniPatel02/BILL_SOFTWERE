import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BankStatementPDF = ({ 
  transactions, 
  mode, 
  selectedBank, 
  fromDate, 
  toDate, 
  onDownloadComplete 
}) => {
  const pdfRef = useRef();

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}-${m}-${y}`;
  }

  const generatePDF = async () => {
    if (!pdfRef.current) {
      console.error('PDF ref not found');
      if (onDownloadComplete) onDownloadComplete();
      return;
    }

    const element = pdfRef.current;
    const prevDisplay = element.style.display;
    element.style.display = 'block'; // Temporarily show for capture
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.display = prevDisplay; // Hide again

      const imgData = canvas.toDataURL('image/png');
      if (!imgData.startsWith('data:image/png')) {
        console.error('Failed to generate valid PNG image');
        throw new Error('Failed to generate a valid PNG image for PDF.');
      }

      const filename = `BankStatement_${mode}_${selectedBank || 'All'}_${fromDate || 'all'}_${toDate || 'all'}.pdf`;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);

      // Calculate image dimensions to fit A4 portrait with proper margins
      let pdfWidth = pageWidth - 20; // 10mm margin on each side
      let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If content is too tall, we'll need multiple pages
      const maxHeightPerPage = pageHeight - 20; // 10mm margin top and bottom
      const totalPages = Math.ceil(pdfHeight / maxHeightPerPage);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        const sourceY = page * maxHeightPerPage * (imgProps.height / pdfHeight);
        const sourceHeight = Math.min(maxHeightPerPage * (imgProps.height / pdfHeight), imgProps.height - sourceY);
        const destHeight = Math.min(maxHeightPerPage, pdfHeight - (page * maxHeightPerPage));
        
        const x = (pageWidth - pdfWidth) / 2;
        const y = 10; // Start from top with 10mm margin

        pdf.addImage(
          imgData, 
          'PNG', 
          x, 
          y, 
          pdfWidth, 
          destHeight, 
          undefined, 
          'FAST',
          0,
          sourceY,
          imgProps.width,
          sourceHeight
        );
      }
      
      pdf.save(filename);

      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF: ' + error.message);
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    }
  };

  useEffect(() => {
    if (transactions) {
      generatePDF();
    }
  }, [transactions]);

  if (!transactions) {
    return <div>Loading...</div>;
  }

  // Separate opening balance from other transactions
  const openingTx = transactions.find(tx => tx.type === 'OpeningBalance');
  const otherTransactions = transactions.filter(tx => tx.type !== 'OpeningBalance');

  // Sort other transactions by date ascending (oldest first)
  const sortedTransactions = otherTransactions.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  // Calculate opening balance as of the day before 'fromDate'
  let calculatedOpeningBalance = openingTx ? Number(openingTx.amount) : 0;
  if (fromDate && openingTx) {
    // Sum all credits and debits up to (but not including) fromDate
    sortedTransactions.forEach(tx => {
      if (tx.date < fromDate) {
        if (tx.credit) calculatedOpeningBalance += Number(tx.amount);
        if (tx.debit) calculatedOpeningBalance -= Number(tx.amount);
      }
    });
  }

  // Filter transactions for the table: from 'fromDate' onward
  let filteredTransactions = sortedTransactions;
  if (fromDate) {
    filteredTransactions = filteredTransactions.filter(tx => tx.date >= fromDate);
  }
  if (toDate) {
    filteredTransactions = filteredTransactions.filter(tx => tx.date <= toDate);
  }

  // Calculate totals for the visible table
  let totalCredit = 0, totalDebit = 0;
  filteredTransactions.forEach(tx => {
    if (tx.credit) totalCredit += Number(tx.amount);
    if (tx.debit) totalDebit += Number(tx.amount);
  });

  const getDetails = (tx) => tx.details || '-';

  // Generate heading based on mode
  const getHeading = () => {
    if (mode === 'Bank' && selectedBank) {
      return `Transactions for ${selectedBank}`;
    } else if (mode === 'Cash') {
      return 'Cash Transactions';
    } else {
      return 'All Bank & Cash Entries';
    }
  };

  return (
    <div
      ref={pdfRef}
      style={{
        width: '1116px',
        margin: '0 auto',
        background: '#fff',
        display: 'none', // Always hidden
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        zIndex: -1,
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
             {/* Header */}
       <div style={{ textAlign: 'center', marginBottom: '30px' }}>
         <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#333' }}>
           Bank & Cash Statements
         </h1>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '15px 0', color: '#1976d2' }}>
           {getHeading()}
         </h2>
         {(fromDate || toDate) && (
           <p style={{ fontSize: '18px', color: '#666', margin: '8px 0' }}>
             {fromDate && `From: ${formatDate(fromDate)}`}
             {fromDate && toDate && ' to '}
             {toDate && `To: ${formatDate(toDate)}`}
           </p>
         )}
       </div>

             {/* Opening Balance */}
       {((mode === 'Bank' && selectedBank) || mode === 'Cash') && openingTx && (
         <div style={{
           background: '#e6f7ff',
           color: '#005580',
           fontWeight: '600',
           padding: '16px 24px',
           borderRadius: '8px',
           marginBottom: '25px',
           fontSize: '20px',
           border: '1px solid #b3d9ff'
         }}>
           Opening Balance: <strong>{calculatedOpeningBalance.toFixed(2)}</strong>
           {fromDate && (
             <> (as of {(() => {
               const d = new Date(fromDate);
               d.setDate(d.getDate() - 1);
               return formatDate(d.toISOString().split('T')[0]);
             })()})</>
           )}
         </div>
       )}

             {/* Table */}
       <table style={{
         width: '100%',
         borderCollapse: 'collapse',
         border: '1px solid #ddd',
         fontSize: '16px'
       }}>
         <thead>
           <tr style={{ background: '#f8f9fa' }}>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Details</th>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Credit</th>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Debit</th>
             <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Amount</th>
           </tr>
         </thead>
        <tbody>
          {(() => {
            let runningBalance = calculatedOpeningBalance;
            return filteredTransactions.map((tx, idx) => {
              const credit = tx.credit ? Number(tx.amount) : 0;
              const debit = tx.debit ? Number(tx.amount) : 0;
              runningBalance = runningBalance + credit - debit;
                               return (
                   <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>{formatDate(tx.date)}</td>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>{getDetails(tx)}</td>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>{tx.details || '-'}</td>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>{credit ? credit.toFixed(2) : '-'}</td>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>{debit ? debit.toFixed(2) : '-'}</td>
                     <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{runningBalance.toFixed(2)}</td>
                   </tr>
                 );
            });
          })()}
                     {/* Total Row */}
           <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
             <td colSpan={3} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>Total</td>
             <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>{totalCredit.toFixed(2)}</td>
             <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{totalDebit.toFixed(2)}</td>
             <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>{(calculatedOpeningBalance + totalCredit - totalDebit).toFixed(2)}</td>
           </tr>
        </tbody>
      </table>

             {/* Footer */}
       <div style={{ 
         marginTop: '25px', 
         textAlign: 'center', 
         fontSize: '16px', 
         color: '#666',
         borderTop: '1px solid #ddd',
         paddingTop: '15px'
       }}>
         Generated on: {formatDate(new Date().toISOString())}
       </div>
    </div>
  );
};

export default BankStatementPDF; 