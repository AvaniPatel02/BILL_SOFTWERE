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
import UpdateLogo from './components/Dashboard/UpdateLogo';
import TaxInvoices from './components/TaxInvoices/TaxInvoices';
import Bills from './components/Bills/Bills';
import YearBills from './components/Bills/YearBills';
import PersonBill from './components/Bills/PersonBill';
import Banking from "./components/Dashboard/Banking";
import Address from './components/Dashboard/Address';
import Clients from './components/Dashboard/Clients';
import BankAdd from './components/Dashboard/BankAdd';
import Employee from './components/Dashboard/Employee';
import Buyer from './components/Dashboard/Buyer';
import Accounting from './components/Dashboard/Accounting';
import AccountStatement from './components/Dashboard/AccountStatement';
import ViewBill from './components/Bills/ViewBill';
import EditTaxInvoice from './components/TaxInvoices/EditTaxInvoice';


function MainLayout() {
  const location = useLocation();

  const showSidebar = ["/dashboard", "/settings", "/profile", "/update-logo", "/taxinvoices", "/employee"].includes(location.pathname);

  return (
    <div className="App" style={{ display: 'flex' }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, marginLeft: showSidebar ? 70 : 0 }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/banking" element={<Banking />} />
          <Route path="/taxinvoices" element={<TaxInvoices />} />
          <Route path="/update-logo" element={<UpdateLogo />} />
          <Route path="/employee" element={<ProtectedRoute><Employee /></ProtectedRoute>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/bills/:year" element={<YearBills />} />
          <Route path="/bills/:year/:buyerName" element={<PersonBill />} />
          <Route path="/view-bill/:invoiceId" element={<ProtectedRoute><ViewBill /></ProtectedRoute>} />
          <Route path="/buyer" element={<ProtectedRoute><Buyer /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/taxinvoices" element={<ProtectedRoute><TaxInvoices /></ProtectedRoute>} />
          <Route path="/update-logo" element={<ProtectedRoute><UpdateLogo /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/address" element={<ProtectedRoute><Address /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/bank-add" element={<ProtectedRoute><BankAdd /></ProtectedRoute>} />
          <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
          <Route path="/edit-invoice/:id" element={<EditTaxInvoice />} />
          <Route path="/account-statement" element={<ProtectedRoute><AccountStatement /></ProtectedRoute>} />
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
