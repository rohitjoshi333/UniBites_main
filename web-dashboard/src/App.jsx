import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import VendorLayout from './components/VendorLayout';
import AdminLayout from './components/AdminLayout';
import VendorDashboard from './pages/VendorDashboard';
import VendorMenuManagement from './pages/VendorMenuManagement';
import VendorOrders from './pages/VendorOrders';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ManageCanteens from './pages/ManageCanteens';
import Login from './pages/Login';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="loading-spinner"></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to the correct dashboard
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Vendor routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="VENDOR">
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<VendorDashboard />} />
            <Route path="menu" element={<VendorMenuManagement />} />
            <Route path="orders" element={<VendorOrders />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="canteens" element={<ManageCanteens />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
