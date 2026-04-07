import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  badge?: number;
  onTabChange?: (id: string) => void;
}

interface HMSLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: string;
}

export default function HMSLayout({ children, navItems, role }: HMSLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation
  useEffect(() => { setSidebarOpen(false); }, [location.pathname, location.search]);

  const isMobile  = screenWidth < 768;
  const isTablet  = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const showHamburger = !isDesktop;

  const getInitialTabId = (): string | null => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      const match = navItems.find(item => item.id === tab && item.onTabChange);
      if (match) return match.id;
    }
    const pathMatch = navItems.find(item => item.onTabChange && item.path === location.pathname);
    if (pathMatch) {
      return navItems.find(item => item.onTabChange && item.path === location.pathname)?.id ?? null;
    }
    return null;
  };

  const [activeTabId, setActiveTabId] = useState<string | null>(getInitialTabId);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const roleConfig: Record<string, { color: string; label: string }> = {
    ADMIN:    { color: '#fbbf24', label: 'Administrator' },
    DOCTOR:   { color: '#4ade80', label: 'Physician' },
    PATIENT:  { color: '#86efac', label: 'Patient' },
    LAB_TECH: { color: '#34d399', label: 'Lab Technician' },
  };
  const rc = roleConfig[role] || roleConfig.PATIENT;

  const handleNavClick = (item: NavItem) => {
    if (item.onTabChange) {
      setActiveTabId(item.id);
      item.onTabChange(item.id);
    } else {
      setActiveTabId(null);
      if (location.pathname !== item.path) navigate(item.path);
    }
    if (showHamburger) setSidebarOpen(false);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.onTabChange) return activeTabId === item.id;
    return location.pathname === item.path;
  };

  // ── Sidebar inner content (reused for desktop + drawer) ──
  const SidebarContent = () => (
    <>
      {/* LOGO */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 6px 16px rgba(34,197,94,0.4)', flexShrink: 0 }}>🏥</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Pulse HMS</div>
            <div style={{ fontSize: '9px', color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Healthcare</div>
          </div>
        </div>
        {/* Close button — only on mobile/tablet */}
        {showHamburger && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#86efac', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}>
            ✕
          </button>
        )}
      </div>

      {/* TAGLINE */}
      <div style={{ padding: '10px 20px', background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '10px', color: '#bbf7d0', fontWeight: '600' }}>✚ Caring for lives since 2024</span>
      </div>

      {/* USER */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${rc.color}, ${rc.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#052e16', flexShrink: 0, fontSize: '14px' }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ecfdf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: '#86efac', marginTop: '1px' }}>{rc.label}</div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: '9px', color: '#4ade8080', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '4px 10px 8px', fontWeight: '700' }}>Main Menu</div>
        {navItems.map(item => {
          const isActive = isItemActive(item);
          return (
            <button key={item.id} onClick={() => handleNavClick(item)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '12px', border: 'none',
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px',
                fontSize: '13px', fontWeight: isActive ? '700' : '500', cursor: 'pointer',
                transition: 'all 0.2s',
                background: isActive ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'transparent',
                color: isActive ? '#fff' : '#bbf7d0',
                boxShadow: isActive ? '0 6px 16px rgba(34,197,94,0.25)' : 'none',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.15)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '17px', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div style={{ padding: '10px 10px 14px' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(74,222,128,0.1)' }}>
          <div style={{ fontSize: '9px', color: '#4ade80', fontWeight: '600', marginBottom: '2px' }}>✚ Emergency</div>
          <div style={{ fontSize: '12px', color: '#86efac', fontWeight: '700' }}>1800-PULSE-911</div>
        </div>
        <button onClick={() => { dispatch(logout()); navigate('/login'); }}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fecaca', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
        >
          🚪 Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', -apple-system, sans-serif", background: `radial-gradient(circle at top left, #bbf7d0, transparent 40%), radial-gradient(circle at bottom right, #86efac, transparent 40%), #e6f4ea` }}>

      {/* ── DESKTOP SIDEBAR (always visible ≥ 1024px) ── */}
      {isDesktop && (
        <aside style={{ width: '256px', flexShrink: 0, background: 'linear-gradient(180deg, #052e16 0%, #065f46 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── MOBILE / TABLET DRAWER ── */}
      {showHamburger && (
        <>
          {/* Backdrop */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 199, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }} />
          )}
          {/* Drawer panel */}
          <aside style={{
            width: isMobile ? '80vw' : '280px',
            maxWidth: '320px',
            background: 'linear-gradient(180deg, #052e16 0%, #065f46 100%)',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 200,
            boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft: isDesktop ? '256px' : 0, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── MOBILE TOP BAR with Hamburger ── */}
        {showHamburger && (
          <div style={{ background: 'linear-gradient(90deg, #052e16, #065f46)', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
            {/* Hamburger button */}
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px', flexShrink: 0 }}>
              <span style={{ width: '20px', height: '2.5px', background: '#4ade80', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
              <span style={{ width: '20px', height: '2.5px', background: '#4ade80', borderRadius: '2px', display: 'block' }} />
              <span style={{ width: '13px', height: '2.5px', background: '#4ade80', borderRadius: '2px', display: 'block', alignSelf: 'flex-start' }} />
            </button>

            {/* Center logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🏥</div>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Pulse HMS</span>
            </div>

            {/* Avatar */}
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${rc.color}, ${rc.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#052e16', flexShrink: 0 }}>
              {initials}
            </div>
          </div>
        )}

        {children}
      </main>

      <style>{`
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive grid fixes */
        @media (max-width: 640px) {
          /* Force single column stat grids on mobile */
          [data-stat-grid] { grid-template-columns: repeat(2, 1fr) !important; }
          [data-stat-grid-5] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 641px) and (max-width: 1023px) {
          [data-stat-grid] { grid-template-columns: repeat(2, 1fr) !important; }
          [data-stat-grid-5] { grid-template-columns: repeat(3, 1fr) !important; }
        }

        /* Smooth scrolling */
        * { box-sizing: border-box; }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}