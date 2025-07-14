import React from "react";
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
            src="https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"
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
            src="https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif"
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
            src="https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif"
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
            src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
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