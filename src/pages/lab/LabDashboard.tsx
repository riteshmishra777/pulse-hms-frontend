import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import { StatCard, Badge, Btn, Table, Tr, Td, PageContent, TopBar, Alert, Modal, Input } from '../../components/UI';

interface LabTest {
  id: number;
  testName: string;
  status: string;
  result: string;
  notes: string;
  createdAt: string;
  price: number;
  patient: { id: number; firstName: string; lastName: string };
}

export default function LabDashboard() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resultModal, setResultModal] = useState<LabTest | null>(null);
  const [resultForm, setResultForm] = useState({ result: '', notes: '' });

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
      const r = await api.get('/lab/all');
      setTests(r.data);
    } catch {}
  };

  const openResult = (test: LabTest) => {
    setResultModal(test);
    setResultForm({ result: test.result || '', notes: test.notes || '' });
  };

  const submitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModal) return;
    try {
      await api.put(`/lab/complete/${resultModal.id}`, resultForm);

      // Auto-generate lab bill
      try {
        await api.post('/billing/generate', {
          patientId:          resultModal.patient.id,
          consultationCharge: 0,
          labCharge:          resultModal.price,
          pharmacyCharge:     0,
          roomCharge:         0,
          otherCharges:       0,
        });
        showMsg('success', `✅ Result submitted & lab bill of ₹${resultModal.price} generated for ${resultModal.patient.firstName}.`);
      } catch {
        showMsg('success', `✅ Result entered for "${resultModal.testName}".`);
      }

      setResultModal(null);
      fetchTests();
    } catch { showMsg('error', 'Failed to submit result.'); }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 5000);
  };

  const pending   = tests.filter(t => t.status === 'PENDING');
  const progress  = tests.filter(t => t.status === 'IN_PROGRESS');
  const completed = tests.filter(t => t.status === 'COMPLETED');
  const tabTests: Record<string, LabTest[]> = { pending, progress, completed, all: tests };

  const navItems = [
    { id: 'pending',   icon: '⏳', label: 'Pending Tests', path: '/lab', badge: pending.length || undefined,  onTabChange: setActiveTab },
    { id: 'progress',  icon: '🔄', label: 'In Progress',   path: '/lab', badge: progress.length || undefined, onTabChange: setActiveTab },
    { id: 'completed', icon: '✅', label: 'Completed',      path: '/lab', badge: undefined,                   onTabChange: setActiveTab },
    { id: 'all',       icon: '📋', label: 'All Tests',      path: '/lab', badge: undefined,                   onTabChange: setActiveTab },
  ];

  return (
    <HMSLayout navItems={navItems} role="LAB_TECH">
      <TopBar title="Lab Dashboard" subtitle="Manage test orders and results" />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <StatCard icon="⏳" label="Pending"     value={pending.length}   color="#f59e0b" onClick={() => setActiveTab('pending')} />
          <StatCard icon="🔄" label="In Progress" value={progress.length}  color="#1a6ef5" onClick={() => setActiveTab('progress')} />
          <StatCard icon="✅" label="Completed"   value={completed.length} color="#10b981" onClick={() => setActiveTab('completed')} />
          <StatCard icon="📋" label="Total Tests" value={tests.length}     color="#8b5cf6" onClick={() => setActiveTab('all')} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'pending',   label: 'Pending',     count: pending.length },
            { id: 'progress',  label: 'In Progress', count: progress.length },
            { id: 'completed', label: 'Completed',   count: completed.length },
            { id: 'all',       label: 'All Tests',   count: tests.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: '1.5px solid',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                borderColor: activeTab === tab.id ? '#16a34a' : '#e2e8f4',
                background:  activeTab === tab.id ? '#f0fdf4' : '#fff',
                color:       activeTab === tab.id ? '#15803d' : '#64748b',
              }}>
              {tab.label}
              <span style={{
                minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px',
                background: activeTab === tab.id ? '#16a34a' : '#f1f5f9',
                color:      activeTab === tab.id ? '#fff' : '#64748b',
                fontSize: '10px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        <Table
          headers={['Test Name', 'Patient', 'Ordered', 'Status', 'Price', 'Action']}
          isEmpty={tabTests[activeTab]?.length === 0}
          empty={{ icon: '🧪', message: `No ${activeTab} tests.` }}
        >
          {tabTests[activeTab]?.map(t => (
            <Tr key={t.id}>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🧪</div>
                  <span style={{ fontWeight: '600' }}>{t.testName}</span>
                </div>
              </Td>
              <Td>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{t.patient?.firstName} {t.patient?.lastName}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {t.patient?.id}</div>
                </div>
              </Td>
              <Td style={{ color: '#475569' }}>{t.createdAt?.split('T')[0]}</Td>
              <Td><Badge status={t.status} /></Td>
              <Td style={{ color: '#16a34a', fontWeight: '600' }}>₹{t.price}</Td>
              <Td>
                {t.status !== 'COMPLETED' && (
                  <Btn variant="primary" size="sm" icon="📝" onClick={() => openResult(t)}>Enter Result</Btn>
                )}
                {t.status === 'COMPLETED' && (
                  <Btn variant="success" size="sm" icon="👁️" onClick={() => openResult(t)}>View Result</Btn>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </PageContent>

      {resultModal && (
        <Modal
          title={resultModal.testName}
          subtitle={`Patient: ${resultModal.patient?.firstName} ${resultModal.patient?.lastName}`}
          icon="🔬"
          onClose={() => setResultModal(null)}
        >
          <form onSubmit={submitResult}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Test Name', value: resultModal.testName },
                { label: 'Status',    value: <Badge status={resultModal.status} /> },
                { label: 'Price',     value: `₹${resultModal.price}` },
                { label: 'Ordered',   value: resultModal.createdAt?.split('T')[0] },
              ].map(item => (
                <div key={item.label as string} style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '600' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#052e16' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <Input label="Test Result"      value={resultForm.result} onChange={v => setResultForm({ ...resultForm, result: v })} placeholder="Enter test result…" required multiline rows={3} />
            <Input label="Additional Notes" value={resultForm.notes}  onChange={v => setResultForm({ ...resultForm, notes: v })}  placeholder="Clinical notes or observations…" multiline rows={2} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Btn variant="secondary" onClick={() => setResultModal(null)} fullWidth>Cancel</Btn>
              <Btn type="submit" variant="primary" fullWidth icon="✅">Submit Result</Btn>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </HMSLayout>
  );
}