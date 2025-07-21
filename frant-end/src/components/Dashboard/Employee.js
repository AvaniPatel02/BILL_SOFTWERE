import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Employee.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import dayjs from 'dayjs';
import { getEmployees, addEmployee, getDeletedEmployees, restoreEmployee } from '../../services/employeeApi';

const Employee = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        joining_date: "",
        salary: "",
        number: ""
    });
    const [employees, setEmployees] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', joining_date: '', salary: '', number: '' });
    const [deletedEmployees, setDeletedEmployees] = useState([]);
    const [showDeletedModal, setShowDeletedModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewEmployeeIndex, setViewEmployeeIndex] = useState(null);
    const [showIncrementModal, setShowIncrementModal] = useState(false);
    const [incrementIndex, setIncrementIndex] = useState(null);
    const [newSalary, setNewSalary] = useState('');
    const [incrementError, setIncrementError] = useState('');

    // Fetch employees from backend on mount
    React.useEffect(() => {
        const loadEmployees = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) return;
                const data = await getEmployees();
                setEmployees(data);
            } catch (err) {
                // Optionally handle error
            }
        };
        loadEmployees();
    }, []);

    // Fetch deleted employees from backend
    const loadDeletedEmployees = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            const data = await getDeletedEmployees();
            setDeletedEmployees(data);
        } catch (err) {
            // Optionally handle error
        }
    };

    // Show deleted employees modal and load data
    const handleShowDeletedModal = () => {
        setShowDeletedModal(true);
        loadDeletedEmployees();
    };

    // Helper to calculate duration
    const getDuration = (joining_date) => {
        if (!joining_date) return '';
        const start = dayjs(joining_date);
        const now = dayjs();
        const years = now.diff(start, 'year');
        const months = now.diff(start.add(years, 'year'), 'month');
        let result = '';
        if (years > 0) result += `${years} year${years > 1 ? 's' : ''}`;
        if (months > 0) result += (result ? ', ' : '') + `${months} month${months > 1 ? 's' : ''}`;
        return result || 'Less than a month';
    };

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Add actionHistory to new employees and send to backend
    const handleAddEmployee = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const employeeData = {
            name: form.name,
            email: form.email,
            joining_date: form.joining_date,
            salary: form.salary,
            number: form.number
        };
        try {
            const saved = await addEmployee(employeeData);
            setEmployees([...employees, saved]);
            setShowModal(false);
            setForm({ name: "", email: "", joining_date: "", salary: "", number: "" });
        } catch (err) {
            // Optionally handle error
        }
    };

    const handleCancel = () => {
        setShowModal(false);
        setForm({ name: "", email: "", joining_date: "", salary: "", number: "" });
    };

    // Modal close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains("employee-modal-overlay")) {
            setShowModal(false);
        }
    };

    const handleEditClick = (idx) => {
        setEditIndex(idx);
        setEditForm(employees[idx]);
        setEditModalOpen(true);
    };

    const handleEditInputChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    // Edit update
    const handleUpdateEmployee = (e) => {
        e.preventDefault();
        const updatedEmployees = [...employees];
        const emp = { ...editForm };
        if (!emp.actionHistory) emp.actionHistory = [];
        emp.actionHistory = [...(emp.actionHistory || []), { action: 'Edited', date: dayjs().format('YYYY-MM-DD HH:mm') }];
        updatedEmployees[editIndex] = emp;
        setEmployees(updatedEmployees);
        setEditModalOpen(false);
        setEditIndex(null);
    };

    const handleEditCancel = () => {
        setEditModalOpen(false);
        setEditIndex(null);
    };

    const handleDeleteClick = (idx) => {
        setDeleteIndex(idx);
        setShowConfirmDelete(true);
    };

    // Delete (soft delete)
    const handleConfirmDelete = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        try {
            // Stub for softDeleteEmployee if it's not directly available from the API service
            // In a real scenario, you would call a DELETE endpoint with auth headers
            // For now, we'll just remove it from the active list
            const updatedEmployees = employees.filter((_, i) => i !== deleteIndex);
            setEmployees(updatedEmployees);
            setShowConfirmDelete(false);
            setDeleteIndex(null);
        } catch (err) {
            // Optionally handle error
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
        setDeleteIndex(null);
    };

    // Restore
    const handleRestoreEmployee = async (idx) => {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        try {
            await restoreEmployee(deletedEmployees[idx].id);
            // Remove from deleted list and reload active employees
            loadDeletedEmployees();
            const active = await getEmployees();
            setEmployees(active);
        } catch (err) {
            // Optionally handle error
        }
    };

    // Increment (open modal)
    const handleIncrement = (idx) => {
        setIncrementIndex(idx);
        setNewSalary(employees[idx].salary);
        setIncrementError('');
        setShowIncrementModal(true);
    };

    const handleIncrementSalaryChange = (e) => {
        setNewSalary(e.target.value);
    };

    const handleIncrementSubmit = (e) => {
        e.preventDefault();
        const oldSalary = Number(employees[incrementIndex].salary);
        const updatedSalary = Number(newSalary);
        if (isNaN(updatedSalary) || updatedSalary <= oldSalary) {
            setIncrementError('New salary must be greater than current salary.');
            return;
        }
        const updatedEmployees = [...employees];
        const emp = { ...updatedEmployees[incrementIndex] };
        emp.salary = updatedSalary;
        if (!emp.actionHistory) emp.actionHistory = [];
        emp.actionHistory = [...(emp.actionHistory || []), { action: `Incremented salary from ${oldSalary} to ${updatedSalary}`, date: dayjs().format('YYYY-MM-DD HH:mm') }];
        updatedEmployees[incrementIndex] = emp;
        setEmployees(updatedEmployees);
        setShowIncrementModal(false);
        setIncrementIndex(null);
        setNewSalary('');
        setIncrementError('');
    };

    const handleIncrementCancel = () => {
        setShowIncrementModal(false);
        setIncrementIndex(null);
        setNewSalary('');
        setIncrementError('');
    };

    const handleViewClick = (idx) => {
        setViewEmployeeIndex(idx);
        setShowViewModal(true);
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewEmployeeIndex(null);
    };

    return (
        <>
        <div className="bills-layout">
            <Header />
            <div className="bills-content">
                <Sidebar />
                <div className="container">
                    <div className="personbill-header-group">
                        <button className="personbill-back-btn" onClick={() => navigate(-1)}>Back</button>
                        <h1 className="personbill-title">Employee Management</h1>
                    </div>
                    <div className="employee-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div></div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="employee-add-btn" onClick={() => setShowModal(true)}>Add Employee</button>
                                <button className="employee-action-btn employee-view-btn" onClick={handleShowDeletedModal}>Deleted Employees</button>
                            </div>
                        </div>
                        <div className="employee-content">
                            {/* Employee table will go here */}
                            {employees.length > 0 && (
                                <table className="employee-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Joining Date</th>
                                            <th>Salary</th>
                                            <th>Mobile No.</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, idx) => (
                                            <tr key={idx}>
                                                <td>{emp.name}</td>
                                                <td>{emp.email}</td>
                                                <td>{emp.joining_date}</td>
                                                <td>{emp.salary}</td>
                                                <td>{emp.number}</td>
                                                <td>
                                                    <button className="employee-action-btn employee-view-btn" onClick={() => handleViewClick(idx)}>View</button>
                                                    <button className="employee-action-btn employee-edit-btn" onClick={() => handleEditClick(idx)}>Edit</button>
                                                    <button className="employee-action-btn employee-increment-btn" onClick={() => handleIncrement(idx)}>Increment</button>
                                                    <button className="employee-action-btn employee-delete-btn" onClick={() => handleDeleteClick(idx)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {showModal && (
            <div className="employee-modal-overlay" onClick={handleOverlayClick}>
                <div className="employee-modal-box">
                    <h2>Add Employee</h2>
                    <form onSubmit={handleAddEmployee}>
                        <div className="employee-form-group">
                            <label>Name</label>
                            <input type="text" name="name" value={form.name} onChange={handleInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Joining Date</label>
                            <input type="date" name="joining_date" value={form.joining_date} onChange={handleInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Salary</label>
                            <input type="number" name="salary" value={form.salary} onChange={handleInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>number Number</label>
                            <input type="text" name="number" value={form.number} onChange={handleInputChange} required />
                        </div>
                        <div className="employee-modal-actions">
                            <button type="submit" className="employee-add-btn">Add Employee</button>
                            <button type="button" className="employee-cancel-btn" onClick={handleCancel}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {editModalOpen && (
            <div className="employee-modal-overlay" onClick={e => { if (e.target.classList.contains('employee-modal-overlay')) setEditModalOpen(false); }}>
                <div className="employee-modal-box">
                    <h2>Edit Employee</h2>
                    <form onSubmit={handleUpdateEmployee}>
                        <div className="employee-form-group">
                            <label>Name</label>
                            <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={editForm.email} onChange={handleEditInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Joining Date</label>
                            <input type="date" name="joining_date" value={editForm.joining_date} onChange={handleEditInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>Salary</label>
                            <input type="number" name="salary" value={editForm.salary} onChange={handleEditInputChange} required />
                        </div>
                        <div className="employee-form-group">
                            <label>number Number</label>
                            <input type="text" name="number" value={editForm.number} onChange={handleEditInputChange} required />
                        </div>
                        <div className="employee-modal-actions">
                            <button type="submit" className="employee-add-btn">Update</button>
                            <button type="button" className="employee-cancel-btn" onClick={handleEditCancel}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {showDeletedModal && (
            <div className="employee-deleted-modal-overlay" onClick={e => { if (e.target.classList.contains('employee-deleted-modal-overlay')) setShowDeletedModal(false); }}>
                <div className="employee-deleted-modal-box">
                    <h2>Deleted Employees</h2>
                    {deletedEmployees.length === 0 ? (
                        <div>No deleted employees.</div>
                    ) : (
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Joining Date</th>
                                    <th>Salary</th>
                                    {/* <th>number</th> */}
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedEmployees.map((emp, idx) => (
                                    <tr key={idx}>
                                        <td>{emp.name}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.joining_date}</td>
                                        <td>{emp.salary}</td>
                                        {/* <td>{emp.number}</td> */}
                                        <td>
                                            <button className="employee-action-btn employee-edit-btn" onClick={() => handleRestoreEmployee(idx)}>Restore</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div style={{ marginTop: '18px', textAlign: 'right' }}>
                        <button className="employee-cancel-btn" onClick={() => setShowDeletedModal(false)}>Close</button>
                    </div>
                </div>
            </div>
        )}
        {showConfirmDelete && (
            <div className="employee-confirm-modal-overlay" onClick={e => { if (e.target.classList.contains('employee-confirm-modal-overlay')) handleCancelDelete(); }}>
                <div className="employee-confirm-modal-box">
                    <h3>Are you sure you want to delete this employee?</h3>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '28px' }}>
                        <button className="employee-cancel-btn" onClick={handleCancelDelete}>Cancel</button>
                        <button className="employee-delete-btn" onClick={handleConfirmDelete}>Delete</button>
                    </div>
                </div>
            </div>
        )}
        {showIncrementModal && incrementIndex !== null && (
            <div className="employee-modal-overlay" onClick={e => { if (e.target.classList.contains('employee-modal-overlay')) handleIncrementCancel(); }}>
                <div className="employee-modal-box">
                    <h2>Increment Salary</h2>
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <strong>{employees[incrementIndex].name}</strong><br/>
                        <span style={{ color: '#555', fontSize: '0.98rem' }}>{employees[incrementIndex].email}</span>
                    </div>
                    <form onSubmit={handleIncrementSubmit}>
                        <div className="employee-form-group">
                            <label>Current Salary</label>
                            <input type="number" value={employees[incrementIndex].salary} disabled />
                        </div>
                        <div className="employee-form-group">
                            <label>New Salary</label>
                            <input type="number" value={newSalary} onChange={handleIncrementSalaryChange} required />
                        </div>
                        {incrementError && <div style={{ color: 'red', marginBottom: 10 }}>{incrementError}</div>}
                        <div className="employee-modal-actions">
                            <button type="submit" className="employee-add-btn">Update Salary</button>
                            <button type="button" className="employee-cancel-btn" onClick={handleIncrementCancel}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {showViewModal && viewEmployeeIndex !== null && (
            <div className="employee-view-modal-overlay" onClick={e => { if (e.target.classList.contains('employee-view-modal-overlay')) handleCloseViewModal(); }}>
                <div className="employee-view-modal-box">
                    <h2>Employee Details</h2>
                    {(() => {
                        const emp = employees[viewEmployeeIndex];
                        return (
                            <>
                                <table className="employee-details-table" style={{ marginTop: 0 }}>
                                    <tbody>
                                        <tr><th>Name</th><td>{emp.name}</td></tr>
                                        <tr><th>Email</th><td>{emp.email}</td></tr>
                                        <tr><th>Joining Date</th><td>{emp.joining_date}</td></tr>
                                        <tr><th>Salary</th><td>{emp.salary}</td></tr>
                                        <tr><th>number</th><td>{emp.number}</td></tr>
                                        <tr><th>Company Duration</th><td>{getDuration(emp.joining_date)}</td></tr>
                                    </tbody>
                                </table>
                                <h3 className="employee-action-history-title">Action History</h3>
                                {emp.actionHistory && emp.actionHistory.length > 0 ? (
                                    <table className="employee-action-history-table" style={{ marginTop: 0 }}>
                                        <thead>
                                            <tr><th>Action</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {emp.actionHistory.map((a, i) => (
                                                <tr key={i}><td>{a.action}</td><td>{a.date}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <div>No actions yet.</div>}
                            </>
                        );
                    })()}
                    <div style={{ marginTop: '18px', textAlign: 'right' }}>
                        <button className="employee-cancel-btn" onClick={handleCloseViewModal}>Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Employee; 