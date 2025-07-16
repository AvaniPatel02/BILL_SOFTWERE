// frant-end/src/services/calculateInvoiceApi.js

import BASE_URL from "./apiConfig";

export const calculateInvoice = async (data) => {
  const response = await fetch(`${BASE_URL}/calculate_invoice/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Calculation failed');
  return response.json();
};

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