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
    headers: getAuthHeaders(),
    credentials: 'include',
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

// Buyer CRUD (unified Buyer model)
export function listBuyers() {
  return fetch(`${API_BASE_URL}/buyer/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function getBuyer(id) {
  return fetch(`${API_BASE_URL}/buyer/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  }).then(res => res.json());
}
export function submitBuyer(data) {
  return fetch(`${API_BASE_URL}/buyer/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function updateBuyer(id, data) {
  return fetch(`${API_BASE_URL}/buyer/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => res.json());
}
export function deleteBuyer(id) {
  return fetch(`${API_BASE_URL}/buyer/${id}/`, {
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
    headers: getAuthHeaders(),
    credentials: 'include',
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
  return fetch(`${API_BASE_URL}/banking/other/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
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
export async function addOtherType(typeName) {
  const response = await fetch(`${API_BASE_URL}/other-types/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ type_name: typeName }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Fetch all 'other' types
export async function fetchOtherTypes() {
  const response = await fetch(`${API_BASE_URL}/other-types/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
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

export async function getOtherNamesByType(typeName) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/banking/other/names/${typeName}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch other names");
  return await response.json();
} 