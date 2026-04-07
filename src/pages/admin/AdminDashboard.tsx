import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import { StatCard, Badge, Btn, Card, Table, Tr, Td, PageContent, TopBar, Alert } from '../../components/UI';

interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalLabTechs: number;
  pendingApprovals: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalDoctors: 0, totalPatients: 0, totalLabTechs: 0, pendingApprovals: 0 });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const isFetching = useRef(false);

  const fetchUsers = useCallback(async (showLoader = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (showLoader) setInitialLoading(true);
    try {
      const response = await api.get('/admin/users');
      const userData: User[] = response.data || [];
      setUsers(userData);
      setStats({
        totalUsers:       userData.length,
        totalDoctors:     userData.filter(x => x.role === 'DOCTOR').length,
        totalPatients:    userData.filter(x => x.role === 'PATIENT').length,
        totalLabTechs:    userData.filter(x => x.role === 'LAB_TECH').length,
        pendingApprovals: userData.filter(x => x.status === 'PENDING_APPROVAL').length,
      });
    } catch {
      if (showLoader) setMsg({ type: 'error', text: 'Failed to load dashboard data.' });
    } finally {
      isFetching.current = false;
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(true); }, [fetchUsers]);

  useEffect(() => {
    const interval = setInterval(() => { fetchUsers(false); }, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const approveUser = async (id: number) => {
    try {
      await api.put(`/admin/approve/${id}`);
      setMsg({ type: 'success', text: 'User approved successfully!' });
      setTimeout(() => setMsg(null), 4000);
      fetchUsers(false);
    } catch { setMsg({ type: 'error', text: 'Failed to approve user.' }); }
  };

  const suspendUser = async (id: number) => {
    try {
      await api.put(`/admin/suspend/${id}`);
      setMsg({ type: 'success', text: 'User suspended successfully!' });
      setTimeout(() => setMsg(null), 4000);
      fetchUsers(false);
    } catch { setMsg({ type: 'error', text: 'Failed to suspend user.' }); }
  };

  const getUserName = (u: User) =>
    u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';

  const filteredUsers = users.filter(u => {
    const matchRole = filter === 'ALL' || u.role === filter;
    const name  = getUserName(u).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const pending = users.filter(u => u.status === 'PENDING_APPROVAL');

  const navItems = [
    { id: 'overview', icon: '🏠', label: 'Overview',        path: '/admin', badge: undefined,                          onTabChange: setActiveTab },
    { id: 'users',    icon: '👥', label: 'User Management', path: '/admin', badge: stats.pendingApprovals || undefined, onTabChange: setActiveTab },
    { id: 'rooms',    icon: '🛏️', label: 'Room Management', path: '/admin/rooms',   badge: undefined },
    { id: 'billing',  icon: '💰', label: 'Billing',         path: '/admin/billing', badge: undefined },
  ];

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Admin Dashboard',  subtitle: 'Hospital management overview' },
    users:    { title: 'User Management',  subtitle: 'Manage doctors, patients & staff' },
  };

  const tt = tabTitles[activeTab] || tabTitles.overview;

  const roleColors: Record<string, string> = {
    DOCTOR:   '#10b981',
    PATIENT:  '#1a6ef5',
    LAB_TECH: '#8b5cf6',
    ADMIN:    '#f59e0b',
  };

  // ✅ Single HMSLayout always rendered — no conditional return before this
  return (
    <HMSLayout navItems={navItems} role="ADMIN">
      <TopBar title={tt.title} subtitle={tt.subtitle} />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}

        {/* Spinner is INSIDE layout, not replacing it */}
        {initialLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <div style={{ color: '#16a34a', fontWeight: '600' }}>Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '28px' }}>
                  <StatCard icon="👥" label="Total Users"       value={stats.totalUsers}       color="#052e16" onClick={() => setActiveTab('users')} />
                  <StatCard icon="🩺" label="Doctors"           value={stats.totalDoctors}     color="#10b981" onClick={() => setActiveTab('users')} />
                  <StatCard icon="🧑‍⚕️" label="Patients"         value={stats.totalPatients}    color="#1a6ef5" onClick={() => setActiveTab('users')} />
                  <StatCard icon="🔬" label="Lab Techs"         value={stats.totalLabTechs}    color="#8b5cf6" onClick={() => setActiveTab('users')} />
                  <StatCard icon="⏳" label="Pending Approvals" value={stats.pendingApprovals} color="#f59e0b" onClick={() => setActiveTab('users')} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <Card title="Quick Actions" subtitle="Common admin tasks">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { icon: '🛏️', label: 'Rooms',   desc: 'Manage rooms',   action: () => navigate('/admin/rooms') },
                        { icon: '💰', label: 'Billing',  desc: 'Track payments', action: () => navigate('/admin/billing') },
                        { icon: '👥', label: 'Users',    desc: 'Manage staff',   action: () => setActiveTab('users') },
                        { icon: '📊', label: 'Reports',  desc: 'View analytics', action: () => {} },
                      ].map(item => (
                        <button key={item.label} onClick={item.action}
                          style={{ padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', fontFamily: 'inherit' }}
                          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#dcfce7'; b.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#f0fdf4'; b.style.transform = 'translateY(0)'; }}>
                          <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#052e16' }}>{item.label}</div>
                          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card title="⏳ Pending Approvals" subtitle={`${pending.length} awaiting review`}
                    action={pending.length > 0 ? <Btn variant="primary" size="sm" onClick={() => setActiveTab('users')}>View All</Btn> : undefined}>
                    {pending.length === 0 ? (
                      <div style={{ textAlign: 'center' as const, padding: '40px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                        <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>All users approved</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {pending.slice(0, 4).map(u => (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.65)',backdropFilter: 'blur(8px)', borderRadius: '10px', border: '1px solid #fde68a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${roleColors[u.role] || '#94a3b8'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: roleColors[u.role] || '#94a3b8' }}>
                                {getUserName(u).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#052e16' }}>{getUserName(u)}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.role.replace('_', ' ')}</div>
                              </div>
                            </div>
                            <Btn variant="success" size="sm" onClick={() => approveUser(u.id)}>Approve</Btn>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* ── USER MANAGEMENT ── */}
            {activeTab === 'users' && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid #bbf7d0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'rgba(255,255,255,0.6)', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#16a34a'}
                      onBlur={e => e.target.style.borderColor = '#bbf7d0'}
                    />
                  </div>
                  {['ALL', 'DOCTOR', 'PATIENT', 'LAB_TECH', 'ADMIN'].map(r => (
                    <button key={r} onClick={() => setFilter(r)}
                      style={{
                        padding: '9px 14px', borderRadius: '10px', border: '1.5px solid',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        borderColor: filter === r ? '#16a34a' : '#bbf7d0',
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(8px)',
                        color:       filter === r ? '#15803d' : '#16a34a',
                      }}>
                      {r === 'ALL' ? 'All' : r === 'LAB_TECH' ? 'Lab Tech' : r.charAt(0) + r.slice(1).toLowerCase()}
                      {filter === r && <span style={{ marginLeft: '4px' }}>✓</span>}
                    </button>
                  ))}
                  <Btn variant="secondary" size="sm" onClick={() => fetchUsers(false)}>🔄 Refresh</Btn>
                </div>

                {filteredUsers.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.7)',backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid #bbf7d0', padding: '60px', textAlign: 'center' as const, color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                    <p style={{ fontSize: '14px', margin: 0 }}>No users found. Try adjusting your search or filter.</p>
                  </div>
                ) : (
                  <Table headers={['User', 'Role', 'Email', 'Status', 'Joined', 'Actions']}>
                    {filteredUsers.map(u => (
                      <Tr key={u.id}>
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${roleColors[u.role] || '#94a3b8'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: roleColors[u.role] || '#94a3b8', flexShrink: 0 }}>
                              {getUserName(u).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#052e16' }}>{getUserName(u)}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {u.id}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `${roleColors[u.role] || '#94a3b8'}20`, color: roleColors[u.role] || '#64748b' }}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </Td>
                        <Td style={{ color: '#475569', fontSize: '13px' }}>{u.email}</Td>
                        <Td><Badge status={u.status} /></Td>
                        <Td style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                        </Td>
                        <Td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {u.status === 'PENDING_APPROVAL' && (
                              <Btn variant="success" size="sm" onClick={() => approveUser(u.id)}>✓ Approve</Btn>
                            )}
                            {u.status !== 'SUSPENDED' && u.role !== 'ADMIN' && (
                              <Btn variant="danger" size="sm" onClick={() => suspendUser(u.id)}>Suspend</Btn>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Table>
                )}
              </div>
            )}
          </>
        )}
      </PageContent>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </HMSLayout>
  );
}