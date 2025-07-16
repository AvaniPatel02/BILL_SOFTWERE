import BASE_URL from "./apiConfig";

export async function fetchInvoices(token) {
  const response = await fetch(`${BASE_URL}/invoices/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error("Failed to fetch invoices");
  return response.json();
}

export async function deleteInvoice(token, invoiceId) {
  const response = await fetch(`${BASE_URL}/invoices/${invoiceId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response;
} 