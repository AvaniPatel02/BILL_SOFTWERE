import React, { useState, useEffect } from "react";
import Sidebar from "../Dashboard/Sidebar";
import Header from "../Dashboard/Header";
import { useParams } from "react-router-dom";
import { getInvoiceById, updateInvoice } from "../../services/taxInvoiceApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditInvoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      getInvoiceById(id)
        .then((data) => {
          if (!data) return; // Prevent setting empty data
          console.log('Fetched invoice data:', data); // Debug
          setInvoice((prev) => ({ ...prev, ...data }));
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load invoice.');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateInvoice(id, invoice);
      toast.success('Invoice updated successfully!');
    } catch (err) {
      toast.error('Failed to update invoice: ' + (err.message || err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading invoice data...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div style={{ maxWidth: 700, margin: '32px auto', background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>Loading invoice data...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>{error}</div>
          ) : invoice ? (
            <>
              <h2>Edit Invoice #{id}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label>
                  Buyer Name:
                  <input name="buyer_name" value={invoice.buyer_name || ''} onChange={handleChange} />
                </label>
                <label>
                  Buyer Address:
                  <input name="buyer_address" value={invoice.buyer_address || ''} onChange={handleChange} />
                </label>
                <label>
                  Buyer GST:
                  <input name="buyer_gst" value={invoice.buyer_gst || ''} onChange={handleChange} />
                </label>
                <label>
                  Consignee Name:
                  <input name="consignee_name" value={invoice.consignee_name || ''} onChange={handleChange} />
                </label>
                <label>
                  Consignee Address:
                  <input name="consignee_address" value={invoice.consignee_address || ''} onChange={handleChange} />
                </label>
                <label>
                  Consignee GST:
                  <input name="consignee_gst" value={invoice.consignee_gst || ''} onChange={handleChange} />
                </label>
                <label>
                  Invoice Number:
                  <input name="invoice_number" value={invoice.invoice_number || ''} onChange={handleChange} />
                </label>
                <label>
                  Invoice Date:
                  <input name="invoice_date" type="date" value={invoice.invoice_date || ''} onChange={handleChange} />
                </label>
                <label>
                  Delivery Note:
                  <input name="delivery_note" value={invoice.delivery_note || ''} onChange={handleChange} />
                </label>
                <label>
                  Payment Mode:
                  <input name="payment_mode" value={invoice.payment_mode || ''} onChange={handleChange} />
                </label>
                <label>
                  Delivery Note Date:
                  <input name="delivery_note_date" type="date" value={invoice.delivery_note_date || ''} onChange={handleChange} />
                </label>
                <label>
                  Destination:
                  <input name="destination" value={invoice.destination || ''} onChange={handleChange} />
                </label>
                <label>
                  Terms to Delivery:
                  <input name="terms_to_delivery" value={invoice.terms_to_delivery || ''} onChange={handleChange} />
                </label>
                <label>
                  Country:
                  <input name="country" value={invoice.country || ''} onChange={handleChange} />
                </label>
                <label>
                  State:
                  <input name="state" value={invoice.state || ''} onChange={handleChange} />
                </label>
                <label>
                  Particulars:
                  <input name="particulars" value={invoice.particulars || ''} onChange={handleChange} />
                </label>
                <label>
                  Total Hours:
                  <input name="total_hours" value={invoice.total_hours || ''} onChange={handleChange} />
                </label>
                <label>
                  Rate:
                  <input name="rate" value={invoice.rate || ''} onChange={handleChange} />
                </label>
                <label>
                  Base Amount:
                  <input name="base_amount" value={invoice.base_amount || ''} onChange={handleChange} />
                </label>
                <label>
                  Remark:
                  <input name="remark" value={invoice.remark || ''} onChange={handleChange} />
                </label>
                {/* Add more fields as needed */}
                <button onClick={handleUpdate} disabled={updating} style={{ marginTop: 24, padding: '10px 24px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>
                  {updating ? 'Updating...' : 'Update Invoice'}
                </button>
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;
