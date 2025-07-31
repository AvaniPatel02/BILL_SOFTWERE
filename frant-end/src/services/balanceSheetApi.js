import API_BASE_URL from './apiConfig';

export function fetchBalanceSheet(year) {
  return fetch(`${API_BASE_URL}/balancesheet/?financial_year=${year}`)
    .then(res => res.json());
}

export async function saveBalanceSheetSnapshot(year) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/balancesheet/snapshot/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ financial_year: year })
  });
  return response.json();
}

export function fetchSettlementTest(year) {
  return fetch(`${API_BASE_URL}/balancesheet/settlement-test/?financial_year=${year}`)
    .then(res => res.json());
} 