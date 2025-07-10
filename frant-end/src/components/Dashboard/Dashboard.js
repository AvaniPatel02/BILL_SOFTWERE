import React from "react";
import "../styles/Dashboard.css";
import Header from "./Header";

const Dashboard = () => {
  return (
    <div>
      <Header />
      <div className="dashboard-content">
        <h1>Welcome to the Dashboard</h1>
        <p>This is your dashboard page.</p>
      </div>
    </div>
  );
};

export default Dashboard; 