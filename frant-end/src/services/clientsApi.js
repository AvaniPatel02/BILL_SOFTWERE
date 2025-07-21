import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getInvoices() {
  const response = await fetch(`${API_BASE_URL}/invoices/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return response.json();
}

export async function getInvoice(invoiceId) {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return response.json();
} 