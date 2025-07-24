import API_BASE_URL from './apiConfig';

export async function fetchBalanceSheet(year) {
  const token = localStorage.getItem('access_token');
  let url = `${API_BASE_URL}/balancesheet/`;
  if (year) url += `?year=${year}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch balance sheet');
  return await res.json();
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