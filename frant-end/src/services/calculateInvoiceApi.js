// frant-end/src/services/calculateInvoiceApi.js


import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function calculateInvoice(data) {
  const res = await fetch(`${API_BASE_URL}/calculate_invoice/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });

  return res.json();
}

export async function getInvoices(year) {
  const response = await fetch(`${API_BASE_URL}/invoices/?year=${year}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return response.json();
}

export async function addInvoice(data) {
  const response = await fetch(`${API_BASE_URL}/invoices/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();

} 

