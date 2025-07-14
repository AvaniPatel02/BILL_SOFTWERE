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
import { useLocation } from 'react-router-dom';
import SettingsPage from './components/Settings/SettingsPage';
import Profile from './components/Dashboard/Profile';
import { useEffect } from "react";
import { getProfile, updateProfile, sendCurrentEmailOtp, verifyCurrentEmailOtp, sendNewEmailOtp, verifyNewEmailOtp, updateEmail } from "./services/authApi";

function MainLayout() {
  const location = useLocation();
  const showSidebar = ["/dashboard", "/settings", "/profile"].includes(location.pathname);

  return (
    <div className="App" style={{ display: 'flex' }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, marginLeft: showSidebar ? 70 : 0 }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
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
