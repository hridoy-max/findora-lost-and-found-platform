import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  FileText,
  LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ activePath }) => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Items', path: '/admin/items', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tag },
    { name: 'Claims', path: '/admin/claims', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-line h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-line">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink text-xl">
          <span className="text-cobalt-600">Findora</span>
          <span className="text-xs bg-cobalt-100 text-cobalt-700 px-2 py-0.5 rounded-full uppercase font-bold">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium",
              activePath === path
                ? "bg-cobalt-600 text-white shadow-md shadow-cobalt-200"
                : "text-line-600 hover:bg-line-50 hover:text-ink"
            )}
          >
            <Icon size={20} />
            <span>{name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-line">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-danger hover:bg-danger-50 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar activePath={window.location.pathname} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
