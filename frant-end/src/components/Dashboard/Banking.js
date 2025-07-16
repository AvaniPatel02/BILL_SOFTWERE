import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Banking.css";

const Banking = () => (
  <>
    <Header />
    <div className="banking-container">
      <Sidebar />
      <div className="banking-content">
        <h2 className="banking-title">Banking</h2>
        <p className="banking-description">This is the Banking page.</p>
      </div>
    </div>
  </>
);

export default Banking; 