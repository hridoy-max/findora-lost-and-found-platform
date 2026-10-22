import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Menu, X, User, LogOut, LayoutDashboard, Package, User as UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Browse', path: '/items' },
    { name: 'Report', path: '/report/new', primary: true },
  ];

  const userLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Reports', path: '/my-items', icon: Package },
    { name: 'My Claims', path: '/my-claims', icon: Package },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  const handleLogout = async () => {
    // logout is handled by AuthContext
  };

  return (
    <nav className="bg-surface border-b border-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-headings font-bold text-cobalt">Findora</Link>
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map(link => (
                link.primary ? (
                  <Link key={link.path} to={link.path} className="bg-cobalt text-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-cobalt/90 transition-colors">
                    {link.name}
                  </Link>
                ) : (
                  <Link key={link.path} to={link.path} className="text-ink/60 hover:text-ink text-sm font-medium transition-colors">
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-paper border border-line">
                  <div className="w-6 h-6 rounded-full bg-cobalt/20 flex items-center justify-center text-cobalt text-xs font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-medium text-ink">{user?.full_name}</span>
                </div>
                <div className="relative group">
                  <button className="p-2 rounded-full hover:bg-paper transition-colors">
                    <User size={20} className="text-ink" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-xl shadow-lg py-2 hidden group-hover:block z-50">
                    {userLinks.map(link => (
                      <Link key={link.path} to={link.path} className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-paper transition-colors">
                        <link.icon size={16} /> {link.name}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-cobalt font-bold hover:bg-paper transition-colors border-t border-line">
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-paper transition-colors w-full text-left"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-ink hover:text-cobalt transition-colors">Log in</Link>
                <Link to="/register" className="bg-cobalt text-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-cobalt/90 transition-colors">Sign up</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-ink">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-line px-4 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-lg font-medium py-2",
                link.primary ? "text-cobalt" : "text-ink"
              )}
            >
              {link.name}
            </Link>
          ))}
          <hr className="border-line" />
          {isAuthenticated ? (
            <>
              {userLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className="text-ink/60 py-2 flex items-center gap-2">
                  <link.icon size={18} /> {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="text-cobalt font-bold py-2">Admin Panel</Link>
              )}
              <button onClick={() => {
                logout();
                setIsOpen(false);
              }} className="text-danger py-2 text-left">Sign Out</button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-ink py-2">Log in</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="bg-cobalt text-surface px-4 py-2 rounded-md text-center">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
