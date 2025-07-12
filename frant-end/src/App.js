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
import UpdateLogo from './components/Dashboard/UpdateLogo';
import Taxinvoices from './components/TaxinvoicesBill/taxinvoices';

function MainLayout() {
  const location = useLocation();
  const showSidebar = ["/dashboard", "/settings", "/profile"].includes(location.pathname);

  return (
    <div className="App" style={{ display: 'flex' }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, marginLeft: showSidebar ? 70 : 0 }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/update-logo" element={<UpdateLogo />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/taxinvoices" element={<Taxinvoices />} />
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
