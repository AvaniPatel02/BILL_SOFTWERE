import React from "react";

import "../../styles/Dashboard.css";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <div className="fact-container">
            <div className="stats-container">
              {/* Clients */}
              <div className="stat-card bg-grey">
                <img
                  src="/clicnet.gif"
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
                  src="/total-bill.gif"
                  alt="Total Bills"
                  className="stat-icon"
                  style={{ height: "80px", marginBottom: "0px" }}
                />
                <div className="stat-value">25</div>
                <div className="stat-label">Total Bills</div>
              </div>

              {/* Employees */}
              <div className="stat-card bg-yellow" onClick={() => navigate('/employee')} style={{ cursor: "pointer" }}>
                <img
                  src="/employ.gif"
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
                  src="/new-bill.gif"
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
              { icon: "fas fa-file-invoice", label: "Bills", route: "/bills" },
              { icon: "fas fa-map-marker-alt", label: "Address" },
              { icon: "fas fa-users", label: "Clients" },
              { icon: "fas fa-user-tie", label: "Employee", route: "/employee" },
              { icon: "fas fa-calculator", label: "Accounting" },
              { icon: "fas fa-balance-scale", label: "Balance Sheet" },
              { icon: "fas fa-university", label: "Banking", route: "/banking" },
              { icon: "fas fa-cog", label: "Settings" },
              { icon: "fas fa-image", label: "Update Logo" },
              { icon: "fas fa-plus-circle", label: "Bank Add", route: "/bank-add" },
            ].map((item, idx) => (
              <div
                className="sidebar-card"
                key={item.label}
                onClick={() => item.route && navigate(item.route)}
                style={item.route ? { cursor: "pointer" } : {}}
              >
                <i className={item.icon + " sidebar-card-icon"}></i>
                <div className="sidebar-card-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;