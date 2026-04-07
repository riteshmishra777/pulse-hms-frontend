import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import {
  StatCard,
  Badge,
  Btn,
  Card,
  Table,
  Tr,
  Td,
  PageContent,
  TopBar,
  Alert,
  Modal,
  Input,
} from '../../components/UI';
import { LAB_TESTS } from '../../data/labTests';

interface Appointment {
  id: number;
  patient: { id: number; firstName: string; lastName: string };
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  reason: string;
}

function getUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = JSON.parse(atob(parts[1]));
    const rawId = payload.userId ?? payload.id ?? payload.sub ?? null;
    const parsedId = Number(rawId);

    return Number.isNaN(parsedId) ? null : parsedId;
  } catch {
    return null;
  }
}

export default function DoctorDashboard() {
  const { user } = useSelector((s: RootState) => s.auth);

  const [activeTab, setActiveTab] = useState('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [labModal, setLabModal] = useState<Appointment | null>(null);
  const [labCategory, setLabCategory] = useState('Blood');
  const [labForm, setLabForm] = useState({ testName: '', price: '', notes: '' });

  const [rxModal, setRxModal] = useState<Appointment | null>(null);
  const [rxForm, setRxForm] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    durationDays: '',
    instructions: '',
    price: '',
  });

  const uid = useMemo(() => {
    const rawId = user?.userId || (user as any)?.id || getUserIdFromToken();
    const parsedId = Number(rawId);
    return Number.isNaN(parsedId) ? null : parsedId;
  }, [user]);

  const doctorName = user?.name || (user as any)?.firstName || 'Doctor';
  const today = new Date().toISOString().split('T')[0];

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!uid) {
      setAppointments([]);
      setLoading(false);
      setError('Doctor ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/appointments/doctor/${uid}`);
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setAppointments([]);
      setError(err?.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!uid) return;

    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, [uid, fetchAppointments]);

  const completeAppointment = async (apt: Appointment) => {
    try {
      await api.put(`/appointments/complete/${apt.id}`);

      const feeMap: Record<string, number> = {
        CONSULTATION: 500,
        FOLLOW_UP: 300,
        ROUTINE_CHECKUP: 400,
        EMERGENCY: 1000,
      };

      const consultationCharge = feeMap[apt.type] || 500;

      try {
        await api.post('/billing/generate', {
          patientId: apt.patient.id,
          consultationCharge,
          labCharge: 0,
          pharmacyCharge: 0,
          roomCharge: 0,
          otherCharges: 0,
        });

        showMsg(
          'success',
          `✅ Appointment completed. Consultation bill of ₹${consultationCharge} generated for ${apt.patient.firstName}.`
        );
      } catch {
        showMsg('success', '✅ Appointment completed.');
      }

      await fetchAppointments();
    } catch (err: any) {
      showMsg('error', err?.response?.data?.message || 'Failed to complete appointment.');
    }
  };

  const submitLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labModal) return;

    try {
      await api.post('/lab/request', {
        patientId: labModal.patient.id,
        labTechId: null,
        testName: labForm.testName,
        price: parseFloat(labForm.price || '0'),
        notes: labForm.notes,
      });

      showMsg('success', `🔬 Lab test "${labForm.testName}" requested for ${labModal.patient.firstName}.`);
      setLabModal(null);
      setLabForm({ testName: '', price: '', notes: '' });

      await fetchAppointments();
    } catch (err: any) {
      showMsg('error', err?.response?.data?.message || 'Failed to request lab test.');
    }
  };

  const submitRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxModal) return;

    try {
      await api.post('/pharmacy/prescribe', {
        patientId: rxModal.patient.id,
        ...rxForm,
        durationDays: parseInt(rxForm.durationDays || '0', 10),
        price: parseFloat(rxForm.price || '0'),
      });

      showMsg('success', `💊 Prescription for "${rxForm.medicineName}" added.`);
      setRxModal(null);
      setRxForm({
        medicineName: '',
        dosage: '',
        frequency: '',
        durationDays: '',
        instructions: '',
        price: '',
      });

      await fetchAppointments();
    } catch (err: any) {
      showMsg('error', err?.response?.data?.message || 'Failed to write prescription.');
    }
  };

  const todayApts = appointments.filter(a => a.appointmentDate === today);
  const completedToday = todayApts.filter(a => a.status === 'COMPLETED');
  const pendingToday = todayApts.filter(a => a.status === 'SCHEDULED');

  const categories = ['Blood', 'Urine', 'Imaging', 'Infection', 'Stool'];
  const testsInCategory = LAB_TESTS.filter((t: any) => t.category === labCategory);

  const navItems = [
    {
      id: 'today',
      icon: '📋',
      label: "Today's Patients",
      path: '/doctor',
      badge: pendingToday.length || undefined,
      onTabChange: setActiveTab,
    },
    {
      id: 'all',
      icon: '📅',
      label: 'All Appointments',
      path: '/doctor',
      badge: undefined,
      onTabChange: setActiveTab,
    },
  ];

  if (loading) {
    return (
      <HMSLayout navItems={navItems} role="DOCTOR">
        <TopBar title={`Dr. ${doctorName}`} subtitle="Physician Dashboard" />
        <PageContent>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '380px',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '42px' }}>⏳</div>
            <div style={{ color: '#64748b', fontWeight: 600 }}>Loading appointments...</div>
          </div>
        </PageContent>
      </HMSLayout>
    );
  }

  return (
    <HMSLayout navItems={navItems} role="DOCTOR">
      <TopBar title={`Dr. ${doctorName}`} subtitle="Physician Dashboard" />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}
        {error && <Alert type="error" message={error} />}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <StatCard icon="📅" label="Today's Schedule" value={todayApts.length} color="#16a34a" onClick={() => setActiveTab('today')} />
          <StatCard icon="⏳" label="Pending Today" value={pendingToday.length} color="#f59e0b" />
          <StatCard icon="✅" label="Completed Today" value={completedToday.length} color="#10b981" />
          <StatCard icon="📊" label="Total Appointments" value={appointments.length} color="#8b5cf6" onClick={() => setActiveTab('all')} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <Btn variant="ghost" size="sm" onClick={fetchAppointments} icon="🔄">
            Refresh
          </Btn>
        </div>

        {activeTab === 'today' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <Card
              title="Today's Schedule"
              subtitle={new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              action={
                <Btn variant="ghost" size="sm" onClick={() => setActiveTab('all')}>
                  View All →
                </Btn>
              }
            >
              {todayApts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>😊</div>
                  <p style={{ fontSize: '14px', margin: 0 }}>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todayApts.map((apt, idx) => (
                    <div
                      key={apt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: apt.status === 'COMPLETED' ? '#f0fdf4' : '#f8faff',
                        borderRadius: '14px',
                        border: apt.status === 'COMPLETED' ? '1px solid #bbf7d0' : '1px solid #e2e8f4',
                      }}
                    >
                      <div style={{ width: '60px', textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#052e16' }}>
                          {apt.appointmentTime}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          #{idx + 1}
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '40px', background: '#e2e8f4', flexShrink: 0 }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: apt.status === 'COMPLETED' ? '#dcfce7' : '#dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: apt.status === 'COMPLETED' ? '#16a34a' : '#1d4ed8',
                            flexShrink: 0,
                          }}
                        >
                          {apt.patient?.firstName?.charAt(0)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#052e16' }}>
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </div>

                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            <span
                              style={{
                                background: '#ede9fe',
                                color: '#6d28d9',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                marginRight: '6px',
                              }}
                            >
                              {apt.type?.replace(/_/g, ' ')}
                            </span>

                            {apt.reason && (
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '200px',
                                  display: 'inline-block',
                                  verticalAlign: 'middle',
                                }}
                              >
                                {apt.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <Badge status={apt.status} />

                        {apt.status === 'SCHEDULED' && (
                          <>
                            <Btn variant="ghost" size="sm" icon="🔬" onClick={() => setLabModal(apt)}>
                              Lab
                            </Btn>
                            <Btn variant="ghost" size="sm" icon="💊" onClick={() => setRxModal(apt)}>
                              Rx
                            </Btn>
                            <Btn variant="success" size="sm" icon="✓" onClick={() => completeAppointment(apt)}>
                              Done
                            </Btn>
                          </>
                        )}

                        {apt.status === 'COMPLETED' && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#16a34a',
                              fontWeight: '600',
                              background: '#dcfce7',
                              padding: '4px 10px',
                              borderRadius: '20px',
                            }}
                          >
                            ✅ Billed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'all' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <Table
              headers={['Patient', 'Date', 'Time', 'Type', 'Status', 'Actions']}
              isEmpty={appointments.length === 0}
              empty={{ icon: '📅', message: 'No appointments yet.' }}
            >
              {appointments.map(apt => (
                <Tr key={apt.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: apt.status === 'COMPLETED' ? '#dcfce7' : '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: apt.status === 'COMPLETED' ? '#16a34a' : '#1d4ed8',
                          flexShrink: 0,
                        }}
                      >
                        {apt.patient?.firstName?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '600' }}>
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </span>
                    </div>
                  </Td>

                  <Td style={{ color: '#475569' }}>
                    {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Td>

                  <Td style={{ color: '#475569' }}>{apt.appointmentTime}</Td>

                  <Td>
                    <span
                      style={{
                        background: '#ede9fe',
                        color: '#6d28d9',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {apt.type?.replace(/_/g, ' ')}
                    </span>
                  </Td>

                  <Td>
                    <Badge status={apt.status} />
                  </Td>

                  <Td>
                    {apt.status === 'SCHEDULED' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Btn variant="ghost" size="sm" icon="🔬" onClick={() => setLabModal(apt)}>
                          Lab
                        </Btn>
                        <Btn variant="ghost" size="sm" icon="💊" onClick={() => setRxModal(apt)}>
                          Rx
                        </Btn>
                        <Btn variant="success" size="sm" onClick={() => completeAppointment(apt)}>
                          ✓ Done
                        </Btn>
                      </div>
                    )}

                    {apt.status === 'COMPLETED' && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                        ✅ Billed
                      </span>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}
      </PageContent>

      {labModal && (
        <Modal
          title="Request Lab Test"
          subtitle={`For ${labModal.patient?.firstName} ${labModal.patient?.lastName}`}
          icon="🔬"
          onClose={() => setLabModal(null)}
        >
          <form onSubmit={submitLab}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLabCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderColor: labCategory === cat ? '#16a34a' : '#e2e8f4',
                    background: labCategory === cat ? '#dcfce7' : '#f8faff',
                    color: labCategory === cat ? '#15803d' : '#64748b',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '16px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {testsInCategory.map((t: any) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() =>
                    setLabForm(prev => ({
                      ...prev,
                      testName: t.name,
                      price: String(t.price),
                    }))
                  }
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    borderColor: labForm.testName === t.name ? '#16a34a' : '#e2e8f4',
                    background: labForm.testName === t.name ? '#dcfce7' : '#f8faff',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: labForm.testName === t.name ? '#15803d' : '#052e16',
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', fontWeight: '600' }}>
                    ₹{t.price}
                  </div>
                </button>
              ))}
            </div>

            <Input
              label="Test Name"
              value={labForm.testName}
              onChange={v => setLabForm(prev => ({ ...prev, testName: v }))}
              placeholder="Or type custom test name"
              required
            />
            <Input
              label="Price (₹)"
              value={labForm.price}
              onChange={v => setLabForm(prev => ({ ...prev, price: v }))}
              placeholder="0.00"
              type="number"
            />
            <Input
              label="Notes"
              value={labForm.notes}
              onChange={v => setLabForm(prev => ({ ...prev, notes: v }))}
              placeholder="Special instructions…"
              multiline
              rows={2}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Btn variant="secondary" onClick={() => setLabModal(null)} fullWidth>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" fullWidth icon="🔬">
                Request Test
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {rxModal && (
        <Modal
          title="Write Prescription"
          subtitle={`For ${rxModal.patient?.firstName} ${rxModal.patient?.lastName}`}
          icon="💊"
          onClose={() => setRxModal(null)}
        >
          <form onSubmit={submitRx}>
            <Input
              label="Medicine Name"
              value={rxForm.medicineName}
              onChange={v => setRxForm(prev => ({ ...prev, medicineName: v }))}
              placeholder="e.g. Paracetamol 500mg"
              required
              icon="💊"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Dosage"
                value={rxForm.dosage}
                onChange={v => setRxForm(prev => ({ ...prev, dosage: v }))}
                placeholder="e.g. 1 tablet"
              />
              <Input
                label="Frequency"
                value={rxForm.frequency}
                onChange={v => setRxForm(prev => ({ ...prev, frequency: v }))}
                placeholder="e.g. Twice daily"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Duration (days)"
                value={rxForm.durationDays}
                onChange={v => setRxForm(prev => ({ ...prev, durationDays: v }))}
                placeholder="7"
                type="number"
              />
              <Input
                label="Price (₹)"
                value={rxForm.price}
                onChange={v => setRxForm(prev => ({ ...prev, price: v }))}
                placeholder="0.00"
                type="number"
              />
            </div>

            <Input
              label="Instructions"
              value={rxForm.instructions}
              onChange={v => setRxForm(prev => ({ ...prev, instructions: v }))}
              placeholder="Take after meals, avoid alcohol…"
              multiline
              rows={2}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Btn variant="secondary" onClick={() => setRxModal(null)} fullWidth>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" fullWidth icon="💊">
                Write Prescription
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </HMSLayout>
  );
}