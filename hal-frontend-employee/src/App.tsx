import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import EmployeeLoginPage from '@/pages/EmployeeLoginPage';
import EmployeeDashboardPage from '@/pages/EmployeeDashboardPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Employee Login Route */}
          <Route path="/login" element={<EmployeeLoginPage />} />

          {/* Protected Employee Workspace Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
