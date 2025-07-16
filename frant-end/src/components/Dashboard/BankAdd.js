import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/BankAdd.css";

const BankAdd = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content-area">
        <Header />
        <div className="bankadd-container">
          <h2>Bank Add</h2>
          <p>This is the Bank Add page. Add your content here.</p>
        </div>
      </div>
    </div>
  );
};

export default BankAdd; 