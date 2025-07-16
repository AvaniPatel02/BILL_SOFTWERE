import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Employee.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Employee = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        joiningDate: "",
        salary: "",
        mobile: ""
    });

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddEmployee = (e) => {
        e.preventDefault();
        // Here you would add the employee to your state or backend
        setShowModal(false);
        setForm({ name: "", email: "", joiningDate: "", salary: "", mobile: "" });
    };

    const handleCancel = () => {
        setShowModal(false);
        setForm({ name: "", email: "", joiningDate: "", salary: "", mobile: "" });
    };

    return (

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
                            <button className="add-employee-btn" onClick={() => setShowModal(true)}>Add Employee</button>
                        </div>
                        <div className="employee-content">
                            {/* Employee table will go here */}
                            {showModal && (
                                <div className="modal-overlay">
                                    <div className="modal-box">
                                        <h2>Add Employee</h2>
                                        <form onSubmit={handleAddEmployee}>
                                            <div className="form-group">
                                                <label>Name</label>
                                                <input type="text" name="name" value={form.name} onChange={handleInputChange} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Email</label>
                                                <input type="email" name="email" value={form.email} onChange={handleInputChange} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Joining Date</label>
                                                <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleInputChange} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Salary</label>
                                                <input type="number" name="salary" value={form.salary} onChange={handleInputChange} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Mobile Number</label>
                                                <input type="text" name="mobile" value={form.mobile} onChange={handleInputChange} required />
                                            </div>
                                            <div className="modal-actions">
                                                <button type="submit" className="add-employee-btn">Add Employee</button>
                                                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>


    );
};

export default Employee; 