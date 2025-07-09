import React from 'react';
import '../styles/Footer.css';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="auth-footer">
      <div className="footer-content">
        <div className="footer-copyright">© 2025 Gransolve Infotech. All rights reserved.</div>
        <div className="social-icons">
         
          <a href="https://facebook.com"  className="social-link" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
          <a href="https://twitter.com"  className="social-link" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          <a href="https://instagram.com"  className="social-link" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 