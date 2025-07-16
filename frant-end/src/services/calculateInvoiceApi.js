// frant-end/src/services/calculateInvoiceApi.js

export const calculateInvoice = async (data) => {
  const response = await fetch('http://localhost:8000/api/calculate_invoice/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Calculation failed');
  return response.json();
};

export const saveInvoice = async (data, token) => {
  const response = await fetch('http://localhost:8000/api/invoices/', {
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