import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getSettings() {
  const res = await fetch(`${API_BASE_URL}/auth/settings/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function updateSettings(data) {
  const res = await fetch(`${API_BASE_URL}/auth/settings/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}