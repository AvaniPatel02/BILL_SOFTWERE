import React from 'react';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import styles from '../../styles/YearBills.module.css';
import { useNavigate, useParams } from 'react-router-dom';

const YearBills = () => {
  const navigate = useNavigate();
  const { year } = useParams();

  return (
    <div className="bills-layout">
      <Header />
      <div className="bills-content">
        <Sidebar />
        <div className="container">
          <div className={styles['yearbills-header-bar']}>
            <button className={styles['yearbills-back-btn']} onClick={() => navigate(-1)}>Back</button>
            <h1 className={styles['yearbills-title']}>Bills for  {year}</h1>
          </div>
          {/* Placeholder for bills table */}
          <div className="bills-tab-content">
            <div className={styles['yearbills-table-container']}>
              <p>Table of bills for {year} will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearBills; 