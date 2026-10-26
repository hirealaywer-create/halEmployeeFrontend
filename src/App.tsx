import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import EmployeeLoginPage from '@/pages/EmployeeLoginPage';
import EmployeeDashboardPage from '@/pages/EmployeeDashboardPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/employee-portal">
        <Routes>
          {/* Public Employee Login Route */}
          <Route path="/employee/login" element={<EmployeeLoginPage />} />

          {/* Protected Employee Workspace Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
          </Route>

          {/* Helpful redirects for root / legacy routes */}
          <Route path="/login" element={<Navigate to="/employee/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/employee/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
