import BASE_URL from "./apiConfig";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// BANK ACCOUNTS
export const fetchBanks = () =>
  fetch(`${BASE_URL}/bank-accounts/`, {
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch banks");
    return res.json();
  });

export const addBank = (data) =>
  fetch(`${BASE_URL}/bank-accounts/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to add bank");
    return res.json();
  });

export const updateBank = (id, data) =>
  fetch(`${BASE_URL}/bank-accounts/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to update bank");
    return res.json();
  });

export const deleteBank = (id) =>
  fetch(`${BASE_URL}/bank-accounts/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete bank");
    return res;
  });

export const fetchDeletedBanks = () =>
  fetch(`${BASE_URL}/bank-accounts/deleted/`, {
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch deleted banks");
    return res.json();
  });

export const restoreBank = (id) =>
  fetch(`${BASE_URL}/bank-accounts/${id}/restore/`, {
    method: "POST",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to restore bank");
    return res.json();
  });

// CASH ENTRIES
export const fetchCashEntries = () =>
  fetch(`${BASE_URL}/cash-entries/`, {
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch cash entries");
    return res.json();
  });

export const addCashEntry = (data) =>
  fetch(`${BASE_URL}/cash-entries/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to add cash entry");
    return res.json();
  });

export const updateCashEntry = (id, data) =>
  fetch(`${BASE_URL}/cash-entries/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to update cash entry");
    return res.json();
  });

export const deleteCashEntry = (id) =>
  fetch(`${BASE_URL}/cash-entries/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete cash entry");
    return res;
  });

export const fetchDeletedCashEntries = () =>
  fetch(`${BASE_URL}/cash-entries/deleted/`, {
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch deleted cash entries");
    return res.json();
  });

export const restoreCashEntry = (id) =>
  fetch(`${BASE_URL}/cash-entries/${id}/restore/`, {
    method: "POST",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to restore cash entry");
    return res.json();
  }); 