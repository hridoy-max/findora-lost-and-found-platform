import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Toaster } from 'sonner';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import BrowseItemsPage from './pages/BrowseItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import CreateReportPage from './pages/CreateReportPage';
import EditReportPage from './pages/EditReportPage';
import MyClaimsPage from './pages/MyClaimsPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import ItemClaimsPage from './pages/ItemClaimsPage';
import DashboardPage from './pages/DashboardPage';
import AdminRoute from './routes/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminItemsPage from './pages/admin/AdminItemsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminClaimsPage from './pages/admin/AdminClaimsPage';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items" element={<BrowseItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/report/new" element={<ProtectedRoute><CreateReportPage /></ProtectedRoute>} />
            <Route path="/report/edit/:id" element={<ProtectedRoute><EditReportPage /></ProtectedRoute>} />
            <Route path="/my-claims" element={<ProtectedRoute><MyClaimsPage /></ProtectedRoute>} />
            <Route path="/claims/:id" element={<ProtectedRoute><ClaimDetailPage /></ProtectedRoute>} />
            <Route path="/items/:id/claims" element={<ProtectedRoute><ItemClaimsPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboardPage /></AdminLayout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsersPage /></AdminLayout></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminLayout><AdminUserDetailPage /></AdminLayout></AdminRoute>} />
            <Route path="/admin/items" element={<AdminRoute><AdminLayout><AdminItemsPage /></AdminLayout></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminLayout><AdminCategoriesPage /></AdminLayout></AdminRoute>} />
            <Route path="/admin/claims" element={<AdminRoute><AdminLayout><AdminClaimsPage /></AdminLayout></AdminRoute>} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
