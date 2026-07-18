import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/authContext';
import { ToastProvider } from './components/ui/Toast';
import { Landing } from './pages/Landing';

import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AdminLogin } from './pages/auth/AdminLogin';

import { StudentLayout } from './components/student/StudentLayout';
import { StudentDashboard } from './pages/student/Dashboard';
import { Catalog } from './pages/student/Catalog';
import { StudentOrders } from './pages/student/Orders';
import { StudentPayments } from './pages/student/Payments';
import { StudentDeliverables } from './pages/student/Deliverables';
import { StudentNotifications } from './pages/student/Notifications';
import { StudentSupport } from './pages/student/Support';
import { StudentProfile } from './pages/student/Profile';

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminProjects } from './pages/admin/AdminProjects';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminDeliverables } from './pages/admin/AdminDeliverables';
import { AdminQrCodes } from './pages/admin/AdminQrCodes';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminTickets } from './pages/admin/AdminTickets';
import { AdminReports } from './pages/admin/AdminReports';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'student' | 'admin' }) {
  const { loading, user, profile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/signin'} replace />;
  if (!profile) return <LoadingScreen />;
  if (profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Auth routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Student routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="orders" element={<StudentOrders />} />
        <Route path="payments" element={<StudentPayments />} />
        <Route path="deliverables" element={<StudentDeliverables />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="support" element={<StudentSupport />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="deliverables" element={<AdminDeliverables />} />
        <Route path="qr-codes" element={<AdminQrCodes />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
