import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import GmailAccountsPage from './pages/GmailAccountsPage';
import TemplatesPage from './pages/TemplatesPage';
import NewCampaignPage from './pages/NewCampaignPage';
import CampaignHistoryPage from './pages/CampaignHistoryPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="gmail-accounts" element={<GmailAccountsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="campaigns/new" element={<NewCampaignPage />} />
          <Route path="campaigns" element={<CampaignHistoryPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
