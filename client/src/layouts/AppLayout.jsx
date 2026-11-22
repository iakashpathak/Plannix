import { FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export const Logo = ({ dark = true, large = false }) => (
  <span className={`flex items-center ${large ? "gap-3" : "gap-2.5"}`}>
    <span className={`flex items-center justify-center bg-ink-800 ${large ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg"}`}>
      <svg viewBox="0 0 32 32" className={large ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true">
        <path d="M8 9h9a4 4 0 0 1 0 8h-4" stroke="#3fd0db" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="m16 14-3 3 3 3" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M8 23h9" stroke="#3fd0db" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <circle cx="8" cy="9" r="1.4" fill="#fff" />
        <circle cx="8" cy="23" r="1.4" fill="#fff" />
      </svg>
    </span>
    <span className={`font-display font-bold ${large ? "text-2xl" : "text-xl"} ${dark ? "text-white" : "text-ink-900"}`}>TaskFlow</span>
  </span>
);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]); // close the drawer after navigating

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950 text-ink-300">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Logo />
        <button type="button" className="icon-btn text-ink-300 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "border-brand-500 bg-white/10 text-white" : "border-transparent hover:bg-white/5 hover:text-white"}`
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-3 py-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-ink-400">{user?.email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-white/5 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-pop">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo dark={false} />
        <button type="button" className="btn btn-secondary ml-auto px-3" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
