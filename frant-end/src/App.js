import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Signup from './components/Authenticatons/Signup';
import Login from './components/Authenticatons/Login';
import Dashboard from './components/Dashboard/Dashboard';
// import Payment from './components/Dashboard/Payment';
import Sidebar from './components/Dashboard/Sidebar';
import SettingsPage from './components/Settings/SettingsPage';
import Profile from './components/Dashboard/Profile';
import { useLocation } from 'react-router-dom';
import { useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "./services/authApi";
import UpdateLogo from './components/Dashboard/UpdateLogo';
import TaxInvoices from './components/TaxInvoices/TaxInvoices';
import Bills from './components/Bills/Bills';

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/taxinvoices" element={<TaxInvoices />} />
          <Route path="/update-logo" element={<UpdateLogo />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bills" element={<Bills />} />
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
