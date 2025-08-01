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

export async function deleteInvoice(invoiceId) {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete invoice');
  }
  return true; // Successful delete
}

export async function downloadInvoicePDF(invoiceId) {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/download/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice');
  }
  
  const blob = await response.blob();
  return blob;
}
