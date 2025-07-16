import BASE_URL from "./apiConfig";

export async function fetchNextInvoiceNumber(token) {
  const res = await fetch(`${BASE_URL}/get_next_invoice_number/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch next invoice number');
  return res.json();
}

export async function fetchInvoiceNumberForDate(token, payload) {
  const res = await fetch(`${BASE_URL}/calculate_invoice/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to fetch invoice number for date');
  return res.json();
} 