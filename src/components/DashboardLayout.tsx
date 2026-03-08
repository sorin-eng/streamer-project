import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Megaphone, Handshake, MessageSquare, FileText,
  BarChart3, Shield, Users, Settings, LogOut, Menu, X, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComplianceBypassBanner } from '@/components/ComplianceBypassBanner';

const navByRole: Record<string, { to: string; label: string; icon: any }[]> = {
  casino_manager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/deals', label: 'Deals', icon: Handshake },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  streamer: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/campaigns', label: 'Browse Campaigns', icon: Megaphone },
    { to: '/deals', label: 'My Deals', icon: Handshake },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/reports', label: 'Earnings', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/verifications', label: 'Verifications', icon: Shield },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/deals', label: 'Deals', icon: Handshake },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/admin/audit', label: 'Audit Log', icon: FileText },
  ],
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = navByRole[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Radio className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-accent-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground">
              {user.displayName[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.displayName}</p>
              <p className="text-xs text-sidebar-foreground capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="text-sidebar-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <ComplianceBypassBanner />
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {user.verified ? '✓ Verified' : '⏳ Pending Verification'}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
