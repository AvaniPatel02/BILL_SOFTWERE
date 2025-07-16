import React from "react";

import "../../styles/Dashboard.css";

import Header from "./Header";
import "../../styles/Dashboard.css";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <>
      <Header />
    <div className="fact-container">
      <div className="stats-container">
        {/* Clients */}
        <div className="stat-card bg-grey">
          <img
            src="dash-client.gif"
            alt="Total Clients"
            className="stat-icon"
            style={{ height: "80px", marginBottom: "0px" }}
          />
          <div className="stat-value">10</div>
          <div className="stat-label">Clients</div>
        </div>

        {/* Total Bills */}
        <div className="stat-card bg-green">
          <img
            src="https://cdn.dribbble.com/userupload/26806182/file/original-46e1551746edbbe3a03b91edf46663f8.gif"
            alt="Total Bills"
            className="stat-icon"
            style={{ height: "80px", marginBottom: "0px" }}
          />
          <div className="stat-value">25</div>
          <div className="stat-label">Total Bills</div>
        </div>

        {/* Employees */}
        <div className="stat-card bg-yellow">
          <img
            src="https://www.xanikainfotech.com/assets/images/shapes/usside.gif"
            alt="Total Employees"
            className="stat-icon"
            style={{ height: "80px", marginBottom: "0px" }}
          />
          <div className="stat-value">5</div>
          <div className="stat-label">Total Employee</div>
        </div>

        {/* New Bill */}
        <div className="stat-card bg-blue" onClick={() => navigate('/taxinvoices')} style={{ cursor: 'pointer' }}>
          <img
            src="/2.gif"
            alt="New Bill"
            className="stat-icon"
            style={{ height: "80px", marginBottom: "0px" }}
          />
          <div className="stat-value">+</div>
          <div className="stat-label">New Bill</div>
        </div>
      </div>
    </div>
    {/* Sidebar Items as Cards */}
    <div className="sidebar-cards-container">
      {[
        { icon: "fas fa-user", label: "Profile" },
        { icon: "fas fa-file-invoice", label: "Bills" },
        { icon: "fas fa-map-marker-alt", label: "Address" },
        { icon: "fas fa-users", label: "Clients" },
        { icon: "fas fa-calculator", label: "Accounting" },
        { icon: "fas fa-balance-scale", label: "Balance Sheet" },
        { icon: "fas fa-university", label: "Banking" },
        { icon: "fas fa-cog", label: "Settings" },
        { icon: "fas fa-image", label: "Update Logo" },
      ].map((item, idx) => (
        <div className="sidebar-card" key={item.label}>
          <i className={item.icon + " sidebar-card-icon"}></i>
          <div className="sidebar-card-label">{item.label}</div>
        </div>
      ))}
    </div>
    </>
  );
};

export default Dashboard;