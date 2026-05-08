import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Avatar, Navbar, NavbarContent, NavbarBrand } from "@heroui/react";
import { Home, FileText, Settings, Users, BookOpen, LogOut, Menu } from 'lucide-react';
import { cn } from '../ui/Button';

interface Props {
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Mes devis', path: '/quotes', icon: FileText },
    { label: 'Catalogue', path: '/catalog', icon: BookOpen },
    { label: 'Utilisateurs', path: '/users', icon: Users },
    { label: 'Paramètres', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#07090f] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-[#0d1117] border-r border-[#1e2a3a] flex-shrink-0">
        <div className="px-5 py-5 border-b border-[#1e2a3a]">
          <img src="/peep-logo.png" alt="Peep" className="h-8" />
        </div>
        
        <p className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150",
                  isActive
                    ? "text-green-400 bg-green-500/10 border border-green-500/20 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#161b25]"
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-[#1e2a3a] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 text-xs bg-green-900 text-green-300" name="JD" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">Jean Dupont</p>
              <p className="text-xs text-slate-500 truncate">Commercial</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Navbar */}
        <Navbar isBordered className="md:hidden bg-[#0d1117]">
          <NavbarContent>
            <Menu size={24} className="text-slate-500" />
            <NavbarBrand className="ml-2 gap-2">
              <img src="/peep-logo.png" alt="Peep" className="w-6 h-6" />
              <p className="font-bold text-slate-100">Peep</p>
            </NavbarBrand>
          </NavbarContent>
        </Navbar>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};


