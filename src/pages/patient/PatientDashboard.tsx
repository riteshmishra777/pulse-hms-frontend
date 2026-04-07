import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import { StatCard, Badge, Btn, Card, Table, Tr, Td, PageContent, TopBar, Alert, Modal } from '../../components/UI';
import PaymentGateway from '../../components/PaymentGateway';

interface Appointment { id: number; doctor: { firstName: string; lastName: string }; appointmentDate: string; appointmentTime: string; type: string; status: string; reason: string; }
interface Bill { id: number; totalAmount: number; paidAmount: number; status: string; createdAt: string; consultationCharge: number; roomCharge: number; labCharge: number; pharmacyCharge: number; }
interface LabTest { id: number; testName: string; status: string; result: string; notes: string; createdAt: string; price: number; }
interface Prescription { id: number; medicineName: string; dosage: string; frequency: string; durationDays: number; instructions: string; status: string; createdAt: string; }

function getUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId ?? payload.id ?? null;
  } catch { return null; }
}

function getUserNameFromToken(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'Patient';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.name || payload.firstName || 'Patient';
  } catch { return 'Patient'; }
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [selectedLab, setSelectedLab] = useState<LabTest | null>(null);

  // Always get uid from both Redux AND token — whichever works
  const uid = user?.userId || (user as any)?.id || getUserIdFromToken();
  const patientName = user?.name || user?.firstName || getUserNameFromToken();

  useEffect(() => {
    if (uid) {
      fetchAll();
    }
  }, [uid]);

  const fetchAll = () => {
    fetchAppointments();
    fetchBills();
    fetchLab();
    fetchPrescriptions();
  };

  const fetchAppointments  = async () => { try { const r = await api.get(`/appointments/patient/${uid}`); setAppointments(r.data); } catch {} };
  const fetchBills         = async () => { try { const r = await api.get(`/billing/patient/${uid}`);      setBills(r.data);        } catch {} };
  const fetchLab           = async () => { try { const r = await api.get(`/lab/patient/${uid}`);          setLabTests(r.data);     } catch {} };
  const fetchPrescriptions = async () => { try { const r = await api.get(`/pharmacy/patient/${uid}`);     setPrescriptions(r.data); } catch {} };

  const cancelAppointment = async (id: number) => {
    try {
      await api.put(`/appointments/cancel/${id}`);
      showMsg('success', 'Appointment cancelled successfully.');
      fetchAppointments();
    } catch { showMsg('error', 'Failed to cancel appointment.'); }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const upcoming     = appointments.filter(a => a.status === 'SCHEDULED');
  const pendingBills = bills.filter(b => b.status !== 'PAID');

  const navItems = [
    { id: 'overview',      icon: '🏠', label: 'Overview',      path: '/patient', badge: undefined,                        onTabChange: setActiveTab },
    { id: 'appointments',  icon: '📅', label: 'Appointments',  path: '/patient', badge: upcoming.length || undefined,     onTabChange: setActiveTab },
    { id: 'lab',           icon: '🔬', label: 'Lab Results',   path: '/patient', badge: undefined,                        onTabChange: setActiveTab },
    { id: 'prescriptions', icon: '💊', label: 'Prescriptions', path: '/patient', badge: undefined,                        onTabChange: setActiveTab },
    { id: 'bills',         icon: '💳', label: 'Billing',       path: '/patient', badge: pendingBills.length || undefined, onTabChange: setActiveTab },
  ];

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview:      { title: `Welcome back, ${patientName.split(' ')[0]}`, subtitle: "Here's your health summary" },
    appointments:  { title: 'My Appointments',  subtitle: 'View and manage your scheduled visits' },
    lab:           { title: 'Lab Results',       subtitle: 'Track your test orders and results' },
    prescriptions: { title: 'Prescriptions',     subtitle: 'Your medication history' },
    bills:         { title: 'Billing',           subtitle: 'Manage and pay your invoices' },
  };

  const tt = tabTitles[activeTab];

  return (
    <HMSLayout navItems={navItems} role="PATIENT">
      <TopBar title={tt.title} subtitle={tt.subtitle} />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}
        {!uid && (
          <Alert type="error" message="Session expired. Please log out and log in again." />
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <StatCard icon="📅" label="Upcoming Appointments" value={upcoming.length}      color="#16a34a" onClick={() => setActiveTab('appointments')} />
              <StatCard icon="🔬" label="Lab Tests"             value={labTests.length}      color="#8b5cf6" onClick={() => setActiveTab('lab')} />
              <StatCard icon="💊" label="Prescriptions"         value={prescriptions.length} color="#0891b2" onClick={() => setActiveTab('prescriptions')} />
              <StatCard icon="💳" label="Pending Bills"         value={pendingBills.length}  color={pendingBills.length > 0 ? '#f59e0b' : '#16a34a'} onClick={() => setActiveTab('bills')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
              {/* Upcoming appointments */}
              <Card title="Upcoming Appointments" subtitle={`${upcoming.length} scheduled`}
                action={<Btn variant="primary" size="sm" icon="+" onClick={() => navigate('/book-appointment')}>Book New</Btn>}>
                {upcoming.length === 0 ? (
                  <div style={{ textAlign: 'center' as const, padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
                    <p style={{ fontSize: '14px', margin: '0 0 16px' }}>No upcoming appointments</p>
                    <Btn variant="primary" size="sm" onClick={() => navigate('/book-appointment')} icon="+">Book Now</Btn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {upcoming.map(apt => (
                      <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🩺</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#052e16' }}>Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</div>
                          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
                            {new Date(apt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            &nbsp;·&nbsp;{apt.appointmentTime}&nbsp;·&nbsp;{apt.type?.replace(/_/g, ' ')}
                          </div>
                          {apt.reason && <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>Reason: {apt.reason}</div>}
                        </div>
                        <Btn variant="danger" size="sm" onClick={() => cancelAppointment(apt.id)}>Cancel</Btn>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingBills.length > 0 && (
                  <Card title="⚠️ Pending Bills" subtitle="Action required">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pendingBills.map(b => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e' }}>₹{b.totalAmount - b.paidAmount} due</div>
                            <div style={{ fontSize: '11px', color: '#b45309' }}>{b.createdAt?.split('T')[0]}</div>
                          </div>
                          <Btn variant="primary" size="sm" onClick={() => setActiveBill(b)}>Pay</Btn>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card title="Recent Lab Tests" subtitle={`${labTests.length} total`}>
                  {labTests.length === 0 ? (
                    <div style={{ textAlign: 'center' as const, padding: '20px', color: '#94a3b8', fontSize: '13px' }}>No tests ordered</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {labTests.slice(0, 4).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f0fdf4', borderRadius: '8px' }}>
                          <div style={{ fontSize: '13px', color: '#052e16', fontWeight: '500' }}>{t.testName}</div>
                          <Badge status={t.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <Btn variant="primary" icon="+" onClick={() => navigate('/book-appointment')}>Book Appointment</Btn>
            </div>
            <Table
              headers={['Doctor', 'Date', 'Time', 'Type', 'Reason', 'Status', 'Action']}
              isEmpty={appointments.length === 0}
              empty={{ icon: '📅', message: 'No appointments yet. Book your first one!', action: <Btn variant="primary" onClick={() => navigate('/book-appointment')}>Book Now</Btn> }}
            >
              {appointments.map(apt => (
                <Tr key={apt.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🩺</div>
                      <span style={{ fontWeight: '600' }}>Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</span>
                    </div>
                  </Td>
                  <Td style={{ color: '#475569' }}>{new Date(apt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                  <Td style={{ color: '#475569' }}>{apt.appointmentTime}</Td>
                  <Td><span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{apt.type?.replace(/_/g, ' ')}</span></Td>
                  <Td style={{ color: '#94a3b8', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{apt.reason || '—'}</Td>
                  <Td><Badge status={apt.status} /></Td>
                  <Td>{apt.status === 'SCHEDULED' && <Btn variant="danger" size="sm" onClick={() => cancelAppointment(apt.id)}>Cancel</Btn>}</Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── LAB RESULTS ── */}
        {activeTab === 'lab' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <Table
              headers={['Test Name', 'Ordered On', 'Status', 'Result', 'Price', '']}
              isEmpty={labTests.length === 0}
              empty={{ icon: '🧪', message: 'No lab tests ordered yet. Your doctor will request tests after consultation.' }}
            >
              {labTests.map(t => (
                <Tr key={t.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🧪</div>
                      <span style={{ fontWeight: '600' }}>{t.testName}</span>
                    </div>
                  </Td>
                  <Td style={{ color: '#475569' }}>{t.createdAt?.split('T')[0]}</Td>
                  <Td><Badge status={t.status} /></Td>
                  <Td>
                    {t.result
                      ? <span style={{ color: '#065f46', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{t.result}</span>
                      : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>Awaiting result…</span>
                    }
                  </Td>
                  <Td style={{ color: '#16a34a', fontWeight: '600' }}>₹{t.price}</Td>
                  <Td>{t.result && <Btn variant="ghost" size="sm" onClick={() => setSelectedLab(t)}>View</Btn>}</Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── PRESCRIPTIONS ── */}
        {activeTab === 'prescriptions' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            {prescriptions.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #bbf7d0', padding: '60px', textAlign: 'center' as const, color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💊</div>
                <p style={{ fontSize: '14px' }}>No prescriptions yet. Your doctor will add them after consultation.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {prescriptions.map(p => (
                  <div key={p.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(5,46,22,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>💊</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#052e16' }}>{p.medicineName}</span>
                      </div>
                      <Badge status={p.status} />
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        {[
                          { label: 'Dosage',     value: p.dosage    || '—' },
                          { label: 'Frequency',  value: p.frequency || '—' },
                          { label: 'Duration',   value: `${p.durationDays} days` },
                          { label: 'Prescribed', value: p.createdAt?.split('T')[0] },
                        ].map(item => (
                          <div key={item.label} style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px 10px' }}>
                            <div style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '2px', fontWeight: '600' }}>{item.label}</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#052e16' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {p.instructions && (
                        <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '8px 10px', border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', marginBottom: '2px' }}>📝 Instructions</div>
                          <div style={{ fontSize: '12px', color: '#78350f' }}>{p.instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BILLS ── */}
        {activeTab === 'bills' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            {bills.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #bbf7d0', padding: '60px', textAlign: 'center' as const, color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💳</div>
                <p style={{ fontSize: '14px' }}>No bills generated yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bills.map(b => (
                  <div key={b.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(5,46,22,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🧾</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#052e16' }}>Bill #{b.id}</div>
                          <div style={{ fontSize: '12px', color: '#16a34a' }}>Issued: {b.createdAt?.split('T')[0]}</div>
                        </div>
                      </div>
                      <Badge status={b.status} />
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                        {[
                          { label: 'Consultation', value: b.consultationCharge ?? 0, icon: '🩺' },
                          { label: 'Room',         value: b.roomCharge         ?? 0, icon: '🏠' },
                          { label: 'Lab',          value: b.labCharge          ?? 0, icon: '🧪' },
                          { label: 'Pharmacy',     value: b.pharmacyCharge     ?? 0, icon: '💊' },
                        ].map(item => (
                          <div key={item.label} style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', textAlign: 'center' as const, border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
                            <div style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{item.label}</div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#052e16', marginTop: '2px' }}>₹{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #dcfce7' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Total Amount</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#052e16', letterSpacing: '-0.5px' }}>₹{b.totalAmount}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Balance Due</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: b.status === 'PAID' ? '#16a34a' : '#f59e0b', letterSpacing: '-0.5px' }}>₹{b.totalAmount - b.paidAmount}</div>
                          </div>
                        </div>
                        {b.status !== 'PAID' ? (
                          <Btn variant="primary" size="lg" icon="💳" onClick={() => setActiveBill(b)}>Pay Now</Btn>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: '600', background: '#dcfce7', padding: '8px 16px', borderRadius: '10px', border: '1px solid #86efac' }}>
                            ✅ Paid in Full
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PageContent>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* Lab result modal */}
      {selectedLab && (
        <Modal title={selectedLab.testName} subtitle="Lab Test Result" icon="🔬" onClose={() => setSelectedLab(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Test Name',  value: selectedLab.testName },
                { label: 'Status',     value: <Badge status={selectedLab.status} /> },
                { label: 'Ordered On', value: selectedLab.createdAt?.split('T')[0] },
                { label: 'Price',      value: `₹${selectedLab.price}` },
              ].map(item => (
                <div key={item.label as string} style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '600' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#052e16' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {selectedLab.result && (
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', border: '1px solid #86efac' }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', marginBottom: '6px' }}>📋 Result</div>
                <div style={{ fontSize: '14px', color: '#14532d', lineHeight: 1.6 }}>{selectedLab.result}</div>
              </div>
            )}
            {selectedLab.notes && (
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>📝 Notes</div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>{selectedLab.notes}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {activeBill && (
        <PaymentGateway
          bill={activeBill}
          onSuccess={() => {
            setActiveBill(null);
            showMsg('success', 'Payment successful! Bill marked as paid.');
            fetchBills();
          }}
          onClose={() => setActiveBill(null)}
        />
      )}
    </HMSLayout>
  );
}