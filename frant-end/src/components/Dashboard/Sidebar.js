import React from "react";
import { Link, useLocation } from "react-router-dom";

import '../../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  return (
    <div className="sidebar-fixed">
      <div className="sidebar-header-bg sidebar-logo-container">
        <img
          src="/logo192.png"
          alt="Logo"
          className="sidebar-logo"
        />
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
        <li className={`nav-item${location.pathname === "/bknadd" ? " active" : ""}`}>
          <Link to="/bknadd" className="nav-link-full">
            <i className="fas fa-plus-circle"></i>
            <span>BKN Add</span>
          </Link>
        </li>
        <li className="nav-item">
          <i className="fas fa-calculator"></i>
          <span>Accounting</span>
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
