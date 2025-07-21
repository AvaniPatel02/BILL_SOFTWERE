import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export function fetchBanks() {
  return fetch(`${API_BASE_URL}/bank-accounts/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}

export const addBank = (data) =>
  fetch(`${API_BASE_URL}/bank-accounts/`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to add bank");
    return res.json();
  });

export const updateBank = (id, data) =>
  fetch(`${API_BASE_URL}/bank-accounts/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to update bank");
    return res.json();
  });

export const deleteBank = (id) =>
  fetch(`${API_BASE_URL}/bank-accounts/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete bank");
  });

export const fetchDeletedBanks = () =>
  fetch(`${API_BASE_URL}/bank-accounts/deleted/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch deleted banks");
    return res.json();
  });

export const restoreBank = (id) =>
  fetch(`${API_BASE_URL}/bank-accounts/${id}/restore/`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to restore bank");
    return res.json();
  });

export const permanentDeleteBank = (id) =>
  fetch(`${API_BASE_URL}/bank-accounts/${id}/permanent-delete/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to permanently delete bank");
  });

// CASH ENTRIES
export const fetchCashEntries = () =>
  fetch(`${API_BASE_URL}/cash-entries/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch cash entries");
    return res.json();
  });

export const addCashEntry = (data) =>
  fetch(`${API_BASE_URL}/cash-entries/`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to add cash entry");
    return res.json();
  });

export const updateCashEntry = (id, data) =>
  fetch(`${API_BASE_URL}/cash-entries/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to update cash entry");
    return res.json();
  });

export const deleteCashEntry = (id) =>
  fetch(`${API_BASE_URL}/cash-entries/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete cash entry");
  });

export const fetchDeletedCashEntries = () =>
  fetch(`${API_BASE_URL}/cash-entries/deleted/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch deleted cash entries");
    return res.json();
  });

export const restoreCashEntry = (id) =>
  fetch(`${API_BASE_URL}/cash-entries/${id}/restore/`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to restore cash entry");
    return res.json();
  });

export const permanentDeleteCashEntry = (id) =>
  fetch(`${API_BASE_URL}/cash-entries/${id}/permanent-delete/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to permanently delete cash entry");
  }); 