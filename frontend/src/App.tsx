import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { LoginPage } from './pages/auth/LoginPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VendedorDashboard } from './pages/vendedor/VendedorDashboard';
import { ProjetistaDashboard } from './pages/projetista/ProjetistaDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/client/*"
        element={
          <ProtectedRoute role="CLIENT">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendedor/*"
        element={
          <ProtectedRoute role="VENDEDOR">
            <VendedorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projetista/*"
        element={
          <ProtectedRoute role="PROJETISTA">
            <ProjetistaDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
