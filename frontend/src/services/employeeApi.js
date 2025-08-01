import { API_BASE_URL } from './apiConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function getEmployees() {
  const res = await fetch(`${API_BASE_URL}/banking/employee/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function addEmployee(data) {
  const res = await fetch(`${API_BASE_URL}/banking/employee/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getEmployee(id) {
  const res = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function getDeletedEmployees() {
  const res = await fetch(`${API_BASE_URL}/banking/employee/deleted/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function restoreEmployee(id) {
  const res = await fetch(`${API_BASE_URL}/banking/employee/${id}/restore/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function fetchEmployeeActions(employeeId) {
  const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/actions/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res.json();
}

export async function softDeleteEmployee(id) {
  const res = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

export async function updateEmployee(id, data) {
  const res = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function permanentDeleteEmployee(id) {
  const res = await fetch(`${API_BASE_URL}/banking/employee/${id}/permanent/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return res;
} 