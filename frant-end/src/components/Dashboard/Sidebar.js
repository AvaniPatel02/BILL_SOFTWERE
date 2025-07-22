import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import '../../styles/Sidebar.css';
import { getProfile } from '../../services/authApi';
import BASE_URL from '../../services/apiConfig';

const Sidebar = () => {
  const location = useLocation();
  const [logo1, setLogo1] = useState("");
  useEffect(() => {
    getProfile().then(res => {
      const data = res.data || {};
      setLogo1(data.image1 ? `${BASE_URL.replace(/\/api$/, '')}${data.image1}` : "");
    });
  }, []);
  return (
    <div className="sidebar-fixed">
      <div className="sidebar-header-bg sidebar-logo-container">
        {logo1 && (
          <img
            src={logo1}
            alt="Sidebar Logo"
            className="sidebar-logo"
          />
        )}
      </div>
      <ul className="sidebar-nav">
        <li className={`nav-item${location.pathname === "/dashboard" ? " active" : ""}`}>
          <Link to="/dashboard" className="nav-link-full">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/bills" ? " active" : ""}`}>
          <Link to="/bills" className="nav-link-full">
            <i className="fas fa-file-invoice"></i>
            <span>Bills</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/address" ? " active" : ""}`}>
          <Link to="/address" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <i className="fas fa-map-marker-alt"></i>
            <span>Address</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/clients" ? " active" : ""}`}>
          <Link to="/clients" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <i className="fas fa-users"></i>
            <span>Clients</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/employee" ? " active" : ""}`}>
          <Link to="/employee" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <i className="fas fa-user-tie"></i>
            <span>Employee</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/bank-add" ? " active" : ""}`}>
          <Link to="/bank-add" className="nav-link-full">
            <i className="fas fa-plus-circle"></i>
            <span>Bank Add</span>
          </Link>
        </li>
        <li className={`nav-item${location.pathname === "/accounting" ? " active" : ""}`}>
          <Link to="/accounting" className="nav-link-full">
            <i className="fas fa-calculator"></i>
            <span>Accounting</span>
          </Link>
        </li>
        <li className="nav-item">
          <i className="fas fa-balance-scale"></i>
          <span>Balance Sheet</span>
        </li>
        <li className={`nav-item${location.pathname === "/banking" ? " active" : ""}`}>
          <Link to="/banking" className="nav-link-full">
            <i className="fas fa-university"></i>
            <span>Banking</span>
          </Link>
        </li>
      </ul>
      <div className="sidebar-bottom">
        <li className={`nav-item${location.pathname === "/settings" ? " active" : ""}`}>
          <Link to="/settings" className="nav-link-full">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </li>
      </div>
    </div>
  );
};

export default Sidebar;
