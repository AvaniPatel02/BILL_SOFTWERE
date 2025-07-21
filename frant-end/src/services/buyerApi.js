import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getBuyers() {
  const res = await fetch(`${API_BASE_URL}/buyer/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function addBuyer(data) {
  const res = await fetch(`${API_BASE_URL}/buyer/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export function fetchBuyerNames() {
  return fetch(`${API_BASE_URL}/banking/buyer-names/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}

export function addBuyerName(data) {
  return fetch(`${API_BASE_URL}/banking/add-buyer-name/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  }).then(res => res.json());
} 
