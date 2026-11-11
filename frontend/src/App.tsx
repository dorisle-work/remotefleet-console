import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { FleetOverviewPage } from './pages/FleetOverviewPage';
import { LiveConsolePage } from './pages/LiveConsolePage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FleetOverviewPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/console/:deploymentId" element={<LiveConsolePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
