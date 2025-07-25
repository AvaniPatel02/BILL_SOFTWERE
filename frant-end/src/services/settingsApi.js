import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getSettings() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const res = await fetch(`/api/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return await res.json();
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

// Upload logo to profile (logoNum: 1 or 2)
export async function uploadLogo(file, logoNum) {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append(logoNum === 1 ? 'image1' : 'image2', file);
  const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
    method: 'PUT',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData
  });
  return res.json();
}