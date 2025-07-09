import React, { useState, useEffect } from 'react';
import '../styles/Header.css';
import logo from '../logo.svg';
import { Link } from 'react-router-dom';

const Header = () => {
  // Add a class to body when sidebar is hovered (using events)
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-fixed');
    if (!sidebar) return;
    const handleMouseEnter = () => document.body.classList.add('sidebar-open');
    const handleMouseLeave = () => document.body.classList.remove('sidebar-open');
    sidebar.addEventListener('mouseenter', handleMouseEnter);
    sidebar.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      sidebar.removeEventListener('mouseenter', handleMouseEnter);
      sidebar.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="custom-header">
      <div className="header-center">
        <img src={logo} alt="Logo" className="header-logo" />
      </div>
      <div 
        className="header-profile"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        <button ><i class="fa-solid fa-user-gear"></i></button>
        {dropdownOpen && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item">Profile</Link>
            <div className="dropdown-item ">Update Logo</div>
            <div className="dropdown-item">Logout</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 