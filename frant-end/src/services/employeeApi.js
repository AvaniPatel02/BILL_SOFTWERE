import BASE_URL from "./apiConfig";

// Fetch all employees (not deleted)
export async function fetchEmployees(token) {
  const res = await fetch(`${BASE_URL}/banking/employee/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

// Add a new employee
export async function addEmployee(token, employeeData) {
  const res = await fetch(`${BASE_URL}/banking/employee/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) throw new Error('Failed to add employee');
  return res.json();
}

// Soft delete an employee
export async function softDeleteEmployee(token, id) {
  const res = await fetch(`${BASE_URL}/employees/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (res.status !== 204) throw new Error('Failed to delete employee');
}

// Fetch deleted employees
export async function fetchDeletedEmployees(token) {
  const res = await fetch(`${BASE_URL}/banking/employee/deleted/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch deleted employees');
  return res.json();
}

// Restore a deleted employee
export async function restoreEmployee(token, id) {
  const res = await fetch(`${BASE_URL}/banking/employee/${id}/restore/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to restore employee');
  return res.json();
} 