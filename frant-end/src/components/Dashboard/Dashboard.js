import React, { useEffect, useState } from "react";

import "../../styles/Dashboard.css";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../../services/clientsApi';
import { listCompanyBills, listBuyerBills } from '../../services/bankingApi';
import { getEmployees } from '../../services/employeeApi';

const Dashboard = () => {
  const navigate = useNavigate();
  // State for dynamic counts
  const [clientCount, setClientCount] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    // Fetch clients (unique by buyer_name, buyer_address, buyer_gst)
    getInvoices().then((invoices) => {
      if (!invoices || !Array.isArray(invoices)) {
        setClientCount(0);
        return;
      }
      const map = new Map();
      invoices.forEach(inv => {
        const key = `${inv.buyer_name}|${inv.buyer_address}|${inv.buyer_gst}`;
        if (!map.has(key)) {
          map.set(key, true);
        }
      });
      setClientCount(map.size);
    });
    // Fetch bills (company + buyer)
    Promise.all([listCompanyBills(), listBuyerBills()]).then(([companyBills, buyerBills]) => {
      setBillCount((companyBills?.length || 0) + (buyerBills?.length || 0));
    });
    // Fetch employees
    getEmployees().then((emps) => {
      setEmployeeCount(Array.isArray(emps) ? emps.length : 0);
    });
  }, []);

  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        {/* <Sidebar /> */}
        <div style={{ flex: 1, marginBottom:'5%' }}>
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

              {/* Total Bills */}
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
            {[{ icon: "fas fa-user", label: "Buyername", route: "/buyer" },
              { icon: "fas fa-user", label: "Profile", route: "/profile" },
              { icon: "fas fa-file-invoice", label: "Bills", route: "/bills" },
              { icon: "fas fa-user-tie", label: "Employee", route: "/employee" },
              { icon: "fas fa-map-marker-alt", label: "Address" ,route: "/address"},
              { icon: "fas fa-users", label: "Clients", route: "/clients" },
              { icon: "fas fa-calculator", label: "Accounting" ,route: "/accounting"},
              { icon: "fas fa-balance-scale", label: "Balance Sheet",route: "/balancesheet" },
              { icon: "fas fa-university", label: "Banking", route: "/banking" },
              { icon: "fas fa-cog", label: "Settings" ,route: "/settings"},
              { icon: "fas fa-image", label: "Update Logo" ,route: "/update-logo"},
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