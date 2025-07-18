// frant-end/src/services/calculateInvoiceApi.js

import BASE_URL from './apiConfig';

export async function calculateInvoice(payload, token) {
  const res = await fetch(`${BASE_URL}/calculate_invoice/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMsg = 'Failed to calculate invoice.';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const saveInvoice = async (data, token) => {
  const response = await fetch(`${BASE_URL}/invoices/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
  return response.json();
};

export const fetchInvoicesByYear = async (year, token) => {
  const response = await fetch(`http://localhost:8000/api/invoices/?year=${year}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
};