import API_BASE_URL from './apiConfig';

export function fetchBalanceSheet(year) {
  return fetch(`${API_BASE_URL}/balancesheet/?financial_year=${year}`)
    .then(res => res.json());
}

export async function saveBalanceSheetSnapshot(year) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/balancesheet/snapshot/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year })
  });
  if (!res.ok) throw new Error('Failed to save snapshot');
  return await res.json();
} 