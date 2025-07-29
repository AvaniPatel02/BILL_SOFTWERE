import React, { useEffect, useState } from "react";
import "../../styles/Dashboard.css";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../../services/clientsApi';
import { getEmployees } from '../../services/employeeApi';

const Dashboard = () => {
  const navigate = useNavigate();
  // State for dynamic counts
  const [clientCount, setClientCount] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [invoicesResponse, employeesResponse] = await Promise.all([
          getInvoices(),
          getEmployees()
        ]);

        // Process clients count
        if (invoicesResponse && Array.isArray(invoicesResponse)) {
          const clientMap = new Map();
          invoicesResponse.forEach(inv => {
            const key = `${inv.buyer_name}|${inv.buyer_address}|${inv.buyer_gst}`;
            if (!clientMap.has(key)) {
              clientMap.set(key, true);
            }
          });
          setClientCount(clientMap.size);
          // Set total bill count (all invoices)
          setBillCount(invoicesResponse.length);
        } else {
          setClientCount(0);
          setBillCount(0);
        }

        // Process employees count
        setEmployeeCount(Array.isArray(employeesResponse) ? employeesResponse.length : 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setClientCount(0);
        setBillCount(0);
        setEmployeeCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Header />
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        {/* <Sidebar /> */}
        <div style={{ flex: 1, marginBottom: '5%' }}>
          <div className="fact-container">
            <div className="stats-container">
              {/* Clients */}
              <div className="stat-card bg-grey" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
                <img
                  src="/clicnet.gif"
                  alt="Total Clients"
                  className="stat-icon"
                  style={{ height: "80px", marginBottom: "0px" }}
                />
                <div className="stat-value">{clientCount}</div>
                <div className="stat-label">Clients</div>
              </div>

              {/* Total Bills - Now shows count of all invoices */}
              <div className="stat-card bg-green" onClick={() => navigate('/bills')} style={{ cursor: 'pointer' }}>
                <img
                  src="/total-bill.gif"
                  alt="Total Bills"
                  className="stat-icon"
                  style={{ height: "80px", marginBottom: "0px" }}
                />
                <div className="stat-value">{billCount}</div>
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
                <div className="stat-value">{employeeCount}</div>
                <div className="stat-label">Total Employee</div>
              </div>

              {/* New Bill */}
              <div className="stat-card bg-blue" onClick={() => navigate('/taxinvoices')} style={{ cursor: 'pointer' }}>
                <img
                  src="2.gif"
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
              { icon: "fas fa-user", label: "Buyername", route: "/buyer" },
              { icon: "fas fa-user", label: "Profile", route: "/profile" },
              { icon: "fas fa-file-invoice", label: "Bills", route: "/bills" },
              { icon: "fas fa-user-tie", label: "Employee", route: "/employee" },
              { icon: "fas fa-map-marker-alt", label: "Address", route: "/address" },
              { icon: "fas fa-users", label: "Clients", route: "/clients" },
              { icon: "fas fa-calculator", label: "Accounting", route: "/accounting" },
              { icon: "fas fa-balance-scale", label: "Balance Sheet", route: "/balancesheet" },
              { icon: "fas fa-university", label: "Banking", route: "/banking" },
              { icon: "fas fa-cog", label: "Settings", route: "/settings" },
              { icon: "fas fa-image", label: "Update Logo", route: "/update-logo" },
              { icon: "fas fa-plus-circle", label: "Bank Add", route: "/bank-add" },
            ].map((item, idx) => (
              <div
                className="sidebar-card"
                key={item.label + '-' + idx}
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