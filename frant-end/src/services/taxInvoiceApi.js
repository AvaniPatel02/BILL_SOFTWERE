import BASE_URL from "./apiConfig";
import { authFetch } from "./authApi";

export async function fetchNextInvoiceNumber() {
  const res = await authFetch(`${BASE_URL}/get_next_invoice_number/`);
  if (!res.ok) throw new Error('Failed to fetch next invoice number');
  return res.json();
}

export async function fetchInvoiceNumberForDate(payload) {
  const res = await authFetch(`${BASE_URL}/calculate_invoice/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to fetch invoice number for date');
  return res.json();
} 