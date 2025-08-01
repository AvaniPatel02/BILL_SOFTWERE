import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// Get all buyers
export function getBuyers(token) {
  return fetch(`${API_BASE_URL}/buyer/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}

// Add a new buyer
export function addBuyer(buyerData) {
  return fetch(`${API_BASE_URL}/buyer/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(buyerData),
  }).then(res => res.json());
}

// Add buyer name (legacy function)
export function addBuyerName(buyerData) {
  return fetch(`${API_BASE_URL}/buyer/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(buyerData),
  }).then(res => res.json());
}

// Get all buyer data (unified Buyer model)
export function fetchAllBuyerData() {
  return fetch(`${API_BASE_URL}/buyer/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}

// Update a buyer
export function updateBuyer(id, buyerData) {
  return fetch(`${API_BASE_URL}/buyer/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(buyerData),
  }).then(res => res.json());
}

// Delete a buyer
export function deleteBuyer(id) {
  return fetch(`${API_BASE_URL}/buyer/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
}

// Get buyer names (for dropdown/autocomplete)
export function fetchBuyerNames() {
  return fetch(`${API_BASE_URL}/banking/buyer-names/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
