import BASE_URL from "./apiConfig";

export async function fetchAddresses(token) {
  const response = await fetch(`${BASE_URL}/invoices/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error("Failed to fetch invoices");
  return response.json();
} 