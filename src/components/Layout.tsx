import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, BarChart3, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, guest, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuth = location.pathname === '/';
  if (isAuth) return <>{children}</>;

  const navItems = [
    { to: '/home', label: 'Train', icon: Dumbbell },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-md"
        style={{ boxShadow: '0 1px 3px rgba(20,40,80,0.06)' }}>
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue" strokeWidth={2.5} />
            <span className="font-display font-bold text-sm tracking-[0.3em] text-ink">COACH</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to} to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors ${
                  location.pathname.startsWith(to) ? 'text-blue bg-blue/8' : 'text-dim hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleSignOut} className="ml-2 p-1.5 text-dim hover:text-red transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : guest ? (
              <Link to="/" className="ml-2 p-1.5 text-blue/60 hover:text-blue transition-colors">
                <UserIcon className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-1.5 text-dim">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-surface-3 px-4 py-2 space-y-0.5 bg-surface-1/95 backdrop-blur-md">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display tracking-wider ${
                  location.pathname.startsWith(to) ? 'text-blue bg-blue/8' : 'text-dim'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
            {user && (
              <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-display text-red/70">
                <LogOut className="w-4 h-4" />Sign out
              </button>
            )}
          </div>
        )}
      </header>
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4">{children}</main>
    </div>
  );
}
