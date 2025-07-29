import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// CompanyBill CRUD
export function listCompanyBills() {
  return fetch(`${API_BASE_URL}/banking/company-bill/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function getCompanyBill(id) {
  return fetch(`${API_BASE_URL}/banking/company-bill/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function submitCompanyBill(data) {
  return fetch(`${API_BASE_URL}/banking/company-bill/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function updateCompanyBill(id, data) {
  return fetch(`${API_BASE_URL}/banking/company-bill/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function deleteCompanyBill(id) {
  return fetch(`${API_BASE_URL}/banking/company-bill/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
}

// Company Bill Form Data APIs
export function getUniqueBuyerNames() {
  return fetch(`${API_BASE_URL}/banking/company-bill/buyer-names/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  });
}

export function getInvoicesByBuyer(buyerName) {
  const encodedBuyerName = encodeURIComponent(buyerName);
  return fetch(`${API_BASE_URL}/banking/company-bill/invoices/${encodedBuyerName}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  });
}

// BuyerBill CRUD
export function listBuyerBills() {
  return fetch(`${API_BASE_URL}/banking/buyer-bill/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function getBuyerBill(id) {
  return fetch(`${API_BASE_URL}/banking/buyer-bill/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function submitBuyerBill(data) {
  return fetch(`${API_BASE_URL}/banking/buyer-bill/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function updateBuyerBill(id, data) {
  return fetch(`${API_BASE_URL}/banking/buyer-bill/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function deleteBuyerBill(id) {
  return fetch(`${API_BASE_URL}/banking/buyer-bill/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
}

// Salary CRUD
export function listSalaries() {
  return fetch(`${API_BASE_URL}/banking/salary/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function getSalary(id) {
  return fetch(`${API_BASE_URL}/banking/salary/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function submitSalary(data) {
  return fetch(`${API_BASE_URL}/banking/salary/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function updateSalary(id, data) {
  return fetch(`${API_BASE_URL}/banking/salary/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function deleteSalary(id) {
  return fetch(`${API_BASE_URL}/banking/salary/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
}

// OtherTransaction CRUD
export function listOtherTransactions() {
  return fetch(`${API_BASE_URL}/banking/other/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function getOtherTransaction(id) {
  return fetch(`${API_BASE_URL}/banking/other/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function submitOtherTransaction(data) {
  return fetch(`${API_BASE_URL}/banking/other/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function updateOtherTransaction(id, data) {
  return fetch(`${API_BASE_URL}/banking/other-transaction/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function deleteOtherTransaction(id) {
  return fetch(`${API_BASE_URL}/banking/other/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
}

// Add a new 'other' type
export async function addOtherType(type) {
  return fetch(`${API_BASE_URL}/api/other-types/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }).then(res => res.json());
}

// Fetch all 'other' types
export async function fetchOtherTypes() {
  return fetch(`${API_BASE_URL}/api/other-types/`).then(res => res.json());
}

// Fetch transactions for bank/cash/all
export function fetchBankCashTransactions({ type = 'all', name = '' } = {}) {
  let url = `${API_BASE_URL}/banking/transactions/?type=${type}`;
  if (type === 'bank' && name) {
    url += `&name=${encodeURIComponent(name)}`;
  }
  return fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  });
}

// Get other names for a specific type
export async function getOtherNames(type) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/banking/other-names/?type=${encodeURIComponent(type)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch other names');
  }
  return await response.json();
}

// Add new other name
export async function addOtherName(type, name) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/banking/other-names/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, name }),
  });
  if (!response.ok) {
    throw new Error('Failed to add other name');
  }
  return await response.json();
} 