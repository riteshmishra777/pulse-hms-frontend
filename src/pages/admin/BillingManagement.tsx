import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import { StatCard, Badge, Btn, Table, Tr, Td, PageContent, TopBar, Alert, Modal, Input, Select } from '../../components/UI';
import PaymentGateway from '../../components/PaymentGateway';

interface Bill { id: number; patient: { id: number; firstName: string; lastName: string }; totalAmount: number; paidAmount: number; status: string; createdAt: string; consultationCharge: number; roomCharge: number; labCharge: number; pharmacyCharge: number; otherCharges: number; }
interface Patient { id: number; firstName: string; lastName: string; }

export default function BillingManagement() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeBill, setActiveBill] = useState<any>(null);
  const [cashModal, setCashModal]   = useState<Bill | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [form, setForm] = useState({ patientId: '', consultationCharge: '0', roomCharge: '0', labCharge: '0', pharmacyCharge: '0', otherCharges: '0' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [br, pr] = await Promise.allSettled([api.get('/billing/all'), api.get('/admin/users')]);
      if (br.status === 'fulfilled') setBills(br.value.data);
      if (pr.status === 'fulfilled') setPatients(pr.value.data.filter((u: any) => u.role === 'PATIENT'));
    } catch {}
  };

  const total      = (f: typeof form) => ['consultationCharge','roomCharge','labCharge','pharmacyCharge','otherCharges'].reduce((s, k) => s + parseFloat((f as any)[k] || 0), 0);
  const grandTotal = total(form);

  const generateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/billing/generate', {
        ...form,
        patientId:          parseInt(form.patientId),
        consultationCharge: parseFloat(form.consultationCharge),
        roomCharge:         parseFloat(form.roomCharge),
        labCharge:          parseFloat(form.labCharge),
        pharmacyCharge:     parseFloat(form.pharmacyCharge),
        otherCharges:       parseFloat(form.otherCharges),
      });
      showMsg('success', 'Bill generated successfully.');
      setShowGenerate(false);
      setForm({ patientId: '', consultationCharge: '0', roomCharge: '0', labCharge: '0', pharmacyCharge: '0', otherCharges: '0' });
      fetchAll();
    } catch { showMsg('error', 'Failed to generate bill.'); }
  };

  const recordCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashModal) return;
    try {
      await api.put(`/billing/pay/${cashModal.id}`, { amount: parseFloat(cashAmount), method: 'CASH' });
      showMsg('success', 'Cash payment recorded.');
      setCashModal(null); setCashAmount('');
      fetchAll();
    } catch { showMsg('error', 'Failed to record payment.'); }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 4000);
  };

  const pending  = bills.filter(b => b.status === 'PENDING');
  const paid     = bills.filter(b => b.status === 'PAID');
  const partial  = bills.filter(b => b.status === 'PARTIALLY_PAID');

  const totalRevenue = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalPending = bills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);

  const tabBills: Record<string, Bill[]> = { all: bills, pending, paid, partial };

  const navItems = [
    { id: 'overview', icon: '🏠', label: 'Overview',        path: '/admin',         badge: undefined,                    onTabChange: (_: string) => navigate('/admin') },
    { id: 'users',    icon: '👥', label: 'User Management', path: '/admin',         badge: undefined,                    onTabChange: (_: string) => navigate('/admin?tab=users') },
    { id: 'rooms',    icon: '🛏️', label: 'Room Management', path: '/admin/rooms',   badge: undefined },
    { id: 'billing',  icon: '💰', label: 'Billing',         path: '/admin/billing', badge: pending.length || undefined },
  ];

  return (
    <HMSLayout navItems={navItems} role="ADMIN">
      <TopBar title="Billing Management" subtitle="Generate bills and track payments" />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <StatCard icon="🧾" label="Total Bills"       value={bills.length}                             color="#0f172a" />
          <StatCard icon="⏳" label="Pending"           value={pending.length}                           color="#f59e0b" />
          <StatCard icon="✅" label="Paid"              value={paid.length}                              color="#10b981" />
          <StatCard icon="💰" label="Revenue Collected" value={`₹${totalRevenue.toLocaleString()}`}      color="#16a34a" />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all',     label: 'All Bills',  count: bills.length },
              { id: 'pending', label: '⏳ Pending', count: pending.length },
              { id: 'partial', label: '🔄 Partial', count: partial.length },
              { id: 'paid',    label: '✅ Paid',     count: paid.length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 14px', borderRadius: '10px', border: '1.5px solid',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                  borderColor: activeTab === tab.id ? '#16a34a' : '#e2e8f4',
                  background:  activeTab === tab.id ? '#f0fdf4' : '#fff',
                  color:       activeTab === tab.id ? '#15803d' : '#64748b',
                }}>
                {tab.label}
                <span style={{ minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 4px', background: activeTab === tab.id ? '#16a34a' : '#f1f5f9', color: activeTab === tab.id ? '#fff' : '#64748b', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{tab.count}</span>
              </button>
            ))}
          </div>
          <Btn variant="primary" size="sm" icon="+" onClick={() => setShowGenerate(true)}>Generate Bill</Btn>
        </div>

        {totalPending > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '13px', fontWeight: '600' }}>
              ⚠️ Outstanding balance: <span style={{ fontSize: '16px', color: '#d97706' }}>₹{totalPending.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#b45309' }}>{pending.length + partial.length} bill(s) pending</div>
          </div>
        )}

        <Table
          headers={['Bill #', 'Patient', 'Date', 'Total', 'Paid', 'Balance', 'Status', 'Actions']}
          isEmpty={tabBills[activeTab]?.length === 0}
          empty={{ icon: '🧾', message: `No ${activeTab} bills.`, action: activeTab === 'all' ? <Btn variant="primary" onClick={() => setShowGenerate(true)}>Generate Bill</Btn> : undefined }}
        >
          {tabBills[activeTab]?.map(b => (
            <Tr key={b.id}>
              <Td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#64748b' }}>#{b.id.toString().padStart(4, '0')}</span></Td>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#16a34a', flexShrink: 0 }}>
                    {b.patient?.firstName?.charAt(0)}
                  </div>
                  <span style={{ fontWeight: '600' }}>{b.patient?.firstName} {b.patient?.lastName}</span>
                </div>
              </Td>
              <Td style={{ color: '#475569' }}>{b.createdAt?.split('T')[0]}</Td>
              <Td style={{ fontWeight: '700' }}>₹{b.totalAmount.toLocaleString()}</Td>
              <Td style={{ color: '#10b981', fontWeight: '600' }}>₹{b.paidAmount.toLocaleString()}</Td>
              <Td style={{ color: b.status === 'PAID' ? '#10b981' : '#f59e0b', fontWeight: '700' }}>₹{(b.totalAmount - b.paidAmount).toLocaleString()}</Td>
              <Td><Badge status={b.status} /></Td>
              <Td>
                {b.status !== 'PAID' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Btn variant="primary" size="sm" icon="💳" onClick={() => setActiveBill({ id: b.id, totalAmount: b.totalAmount, paidAmount: b.paidAmount, status: b.status })}>Online</Btn>
                    <Btn variant="success" size="sm" icon="💵" onClick={() => { setCashModal(b); setCashAmount(String(b.totalAmount - b.paidAmount)); }}>Cash</Btn>
                  </div>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </PageContent>

      {showGenerate && (
        <Modal title="Generate Bill" subtitle="Create a new bill for a patient" icon="🧾" onClose={() => setShowGenerate(false)} width="540px">
          <form onSubmit={generateBill}>
            <Select label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} required
              placeholder="Select patient…"
              options={patients.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Consultation (₹)" value={form.consultationCharge} onChange={v => setForm({ ...form, consultationCharge: v })} type="number" placeholder="0" />
              <Input label="Room Charges (₹)" value={form.roomCharge}         onChange={v => setForm({ ...form, roomCharge: v })}         type="number" placeholder="0" />
              <Input label="Lab Charges (₹)"  value={form.labCharge}          onChange={v => setForm({ ...form, labCharge: v })}          type="number" placeholder="0" />
              <Input label="Pharmacy (₹)"     value={form.pharmacyCharge}     onChange={v => setForm({ ...form, pharmacyCharge: v })}     type="number" placeholder="0" />
              <Input label="Other Charges (₹)" value={form.otherCharges}      onChange={v => setForm({ ...form, otherCharges: v })}       type="number" placeholder="0" />
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>Total Amount</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#166534', letterSpacing: '-0.5px' }}>₹{grandTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="secondary" onClick={() => setShowGenerate(false)} fullWidth>Cancel</Btn>
              <Btn type="submit" variant="primary" fullWidth icon="🧾">Generate Bill</Btn>
            </div>
          </form>
        </Modal>
      )}

      {cashModal && (
        <Modal title="Record Cash Payment" subtitle={`Bill #${cashModal.id.toString().padStart(4,'0')} — ${cashModal.patient?.firstName} ${cashModal.patient?.lastName}`} icon="💵" onClose={() => setCashModal(null)}>
          <form onSubmit={recordCash}>
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Total Amount</span>
                <span style={{ fontWeight: '700' }}>₹{cashModal.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Balance Due</span>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>₹{(cashModal.totalAmount - cashModal.paidAmount).toLocaleString()}</span>
              </div>
            </div>
            <Input label="Amount Received (₹)" value={cashAmount} onChange={v => setCashAmount(v)} type="number" placeholder="Enter amount" required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="secondary" onClick={() => setCashModal(null)} fullWidth>Cancel</Btn>
              <Btn type="submit" variant="success" fullWidth icon="💵">Record Payment</Btn>
            </div>
          </form>
        </Modal>
      )}

      {activeBill && (
        <PaymentGateway
          bill={activeBill}
          onSuccess={() => { setActiveBill(null); showMsg('success', 'Payment successful.'); fetchAll(); }}
          onClose={() => setActiveBill(null)}
        />
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </HMSLayout>
  );
}