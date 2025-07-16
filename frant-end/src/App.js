import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Signup from './components/Authenticatons/Signup';
import Login from './components/Authenticatons/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Sidebar from './components/Dashboard/Sidebar';
import SettingsPage from './components/Settings/SettingsPage';
import Profile from './components/Dashboard/Profile';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import { useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "./services/authApi";
import UpdateLogo from './components/Dashboard/UpdateLogo';
import TaxInvoices from './components/TaxInvoices/TaxInvoices';
import Bills from './components/Bills/Bills';
import Address from './components/Dashboard/Address';
import Clients from './components/Dashboard/Clients';

function MainLayout() {
  const location = useLocation();

  const showSidebar = ["/dashboard", "/settings", "/profile", "/update-logo", "/taxinvoices"].includes(location.pathname);

  return (
    <div className="App" style={{ display: 'flex' }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, marginLeft: showSidebar ? 70 : 0 }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/taxinvoices" element={<ProtectedRoute><TaxInvoices /></ProtectedRoute>} />
          <Route path="/update-logo" element={<ProtectedRoute><UpdateLogo /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/address" element={<ProtectedRoute><Address /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}


function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
