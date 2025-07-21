import { API_BASE_URL } from './apiConfig';


function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getNextInvoiceNumber() {
  const res = await fetch(`${API_BASE_URL}/get_next_invoice_number/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
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