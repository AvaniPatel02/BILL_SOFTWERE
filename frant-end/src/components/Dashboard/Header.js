import React, { useState, useEffect } from 'react';
import '../../styles/Header.css';
import logo from '../../logo.svg';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleProfileClick = () => setDropdownOpen((open) => !open);
  const handleClickOutside = (event) => {
    if (
      dropdownOpen &&
      !event.target.closest('.header-profile')
    ) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <header className="custom-header">
      <div className="header-center">
        <img src={logo} alt="Logo" className="header-logo" />
      </div>
      <div 
        className="header-profile"
      >
        <button onClick={handleProfileClick}><i className="fa-solid fa-user-gear"></i></button>
        {dropdownOpen && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item">Profile</Link>
            <Link to="/update-logo" className="dropdown-item">Update Logo</Link>
            <div className="dropdown-item logout-item" onClick={handleLogout}>Logout</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 