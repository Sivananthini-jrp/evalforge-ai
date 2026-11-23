// evalforge-ai/frontend/src/components/layout/Layout.tsx
import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  LayoutDashboard,
  Database,
  FlaskConical,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'New Experiment', path: '/experiments/new', icon: FlaskConical },
    { name: 'Compare Models', path: '/compare', icon: BarChart3 },
    // MAKE SURE THIS SAYS /reports
    { name: 'Reports', path: '/reports', icon: FileText }, 
  ];

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#07090f] text-white selection:bg-indigo-500/30">
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(30px, -40px, 0) scale(1.05); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      {/* Global Ambient Background (Stage) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-[10%] -top-[20%] h-[40rem] w-[40rem] rounded-full bg-indigo-600/10 blur-[100px]"
          style={{ animation: 'floatBlob 20s ease-in-out infinite' }}
        />
        <div
          className="absolute -right-[5%] bottom-0 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[100px]"
          style={{ animation: 'floatBlob 25s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute left-[30%] top-[20%] h-[25rem] w-[25rem] rounded-full bg-emerald-500/5 blur-[100px]"
          style={{ animation: 'floatBlob 30s ease-in-out infinite' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)',
          }}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="relative z-20 hidden w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0c14]/80 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/30">
              <div className="pointer-events-none absolute inset-x-2 top-0 h-px bg-white/40" />
              <Zap size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                EvalForge
              </h1>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                Reliability Lab
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-400" />
                  )}
                  <item.icon
                    size={18}
                    className={isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-400'}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0c14]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">
              <Zap size={16} />
            </div>
            <span className="font-bold text-white">EvalForge</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              style={{ animation: 'fadeIn .2s ease-out both' }}
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/[0.06] bg-[#0a0c14]"
              style={{ animation: 'slideInLeft .25s cubic-bezier(.22,1,.36,1) both' }}
            >
               <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                  <span className="font-bold text-white">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
               </div>
               <nav className="flex-1 space-y-1 p-3">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                          isActive ? 'bg-white/[0.08] text-white' : 'text-slate-400'
                        }`
                      }
                    >
                      <item.icon size={18} />
                      {item.name}
                    </NavLink>
                  ))}
               </nav>
               <div className="p-4 border-t border-white/[0.06]">
                 <button onClick={handleLogout} className="flex w-full items-center gap-3 text-sm font-medium text-rose-400">
                   <LogOut size={18} /> Sign out
                 </button>
               </div>
            </aside>
          </div>
        )}

        {/* The Scrollable Page Area */}
        <main className="flex-1 overflow-y-auto">
          {/* We add padding here, so the pages don't need their own massive wrappers */}
          <div className="w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}