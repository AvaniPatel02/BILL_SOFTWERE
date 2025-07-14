import React, { useState, useEffect } from 'react';
import '../../styles/Header.css';
import logo from '../../logo.svg';
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

  // Dropdown ko close karne ke liye, jab bahar click ho
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.profile-dropdown');
      const btn = document.querySelector('.header-profile button');
      if (dropdownOpen && dropdown && !dropdown.contains(event.target) && btn && !btn.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="custom-header">
      <div className="header-center">
        <img src={logo} alt="Logo" className="header-logo" />
      </div>
      <div className="header-profile">
        <button onClick={() => setDropdownOpen((open) => !open)}><i className="fa-solid fa-user-gear"></i></button>
        {dropdownOpen && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item">Profile</Link>
            <Link to="/update-logo" className="dropdown-item">Update Logo</Link>
            <div className="dropdown-item logout-item">Logout</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;