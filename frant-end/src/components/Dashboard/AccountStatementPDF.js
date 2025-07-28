import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AccountStatementPDF = ({ 
  data, 
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

      const filename = `AccountStatement_${data.buyer_name}_${fromDate || 'all'}_${toDate || 'all'}.pdf`;
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
    if (data) {
      generatePDF();
    }
  }, [data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div
      ref={pdfRef}
      style={{
        width: '800px',
        margin: '0 auto',
        background: '#fff',
        display: 'none', // Always hidden
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        zIndex: -1,
        padding: '30px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.4'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 15px 0', color: '#333' }}>
          Statement of Account
        </h1>
        {(fromDate || toDate) && (
          <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>
            {fromDate && `From: ${formatDate(fromDate)}`}
            {fromDate && toDate && ' to '}
            {toDate && `To: ${formatDate(toDate)}`}
          </p>
        )}
      </div>

      {/* Customer Information */}
      <div style={{
        background: '#f8f9fa',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Name:</strong> {data.buyer_name}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>GST Number:</strong> {data.buyer_gst}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '10px 0', fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
              <strong>Total Balance:</strong> ₹ {Math.abs(Number(data.total_balance)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Activity Section */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{
          background: '#757575',
          color: '#fff',
          padding: '15px 25px',
          borderRadius: '6px',
          textAlign: 'center',
          margin: '0 0 20px 0',
          fontSize: '22px',
          fontWeight: 'bold'
        }}>
          Account Activity
        </h3>
      </div>

      {/* Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '2px solid #ddd',
        fontSize: '16px',
        marginBottom: '30px'
      }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>Date</th>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '18px' }}>Description</th>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>Credit (Deposit)</th>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>Debit (Invoice)</th>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>Balance</th>
            <th style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {data.statement.map((row, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'center', fontSize: '16px' }}>{row.date}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontSize: '16px' }}>{row.description}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'right', fontSize: '16px' }}>
                {row.credit ? `₹ ${Number(row.credit).toFixed(2)}` : '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'right', fontSize: '16px' }}>
                {row.debit ? `₹ ${Math.abs(Number(row.debit)).toFixed(2)}` : '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                ₹ {Math.abs(Number(row.balance)).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'center', fontSize: '16px' }}>{row.type}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr style={{ fontWeight: 'bold', background: '#f2f2f2' }}>
            <td colSpan={2} style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontSize: '18px' }}>Total:</td>
            <td style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontSize: '18px' }}>
              ₹ {Number(data.total_credit).toFixed(2)}
            </td>
            <td style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontSize: '18px' }}>
              ₹ {Math.abs(Number(data.total_debit)).toFixed(2)}
            </td>
            <td style={{ border: '2px solid #ddd', padding: '15px 10px', textAlign: 'right', fontSize: '18px' }}>
              ₹ {Math.abs(Number(data.total_balance)).toFixed(2)}
            </td>
            <td style={{ border: '2px solid #ddd', padding: '15px 10px' }}></td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '18px', 
        color: '#666',
        borderTop: '2px solid #ddd',
        paddingTop: '20px'
      }}>
        Generated on: {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
};

export default AccountStatementPDF; 