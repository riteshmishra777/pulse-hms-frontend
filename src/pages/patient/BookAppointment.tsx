import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';
import api from '../../api/axiosConfig';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { Btn, Input, Alert } from '../../components/UI';

interface Doctor { id: number; firstName: string; lastName: string; specialization?: string; }

function getUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId ?? payload.id ?? null;
  } catch { return null; }
}

const APPOINTMENT_TYPES = [
  { value: 'CONSULTATION',    label: 'Consultation',    icon: '🩺', desc: 'First visit / new issue' },
  { value: 'FOLLOW_UP',       label: 'Follow-up',       icon: '🔄', desc: 'Review previous treatment' },
  { value: 'ROUTINE_CHECKUP', label: 'Routine Checkup', icon: '📋', desc: 'Periodic health exam' },
  { value: 'EMERGENCY',       label: 'Emergency',       icon: '🚨', desc: 'Urgent medical attention' },
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', type: 'CONSULTATION', reason: '' });

  const uid = user?.userId || (user as any)?.id || getUserIdFromToken();

  useEffect(() => {
    api.get('/appointments/doctors')
      .then(res => setDoctors(res.data))
      .catch(() => setMsg({ type: 'error', text: 'Could not load doctors. Please refresh.' }));
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) { setMsg({ type: 'error', text: 'Please select a date.' }); return; }
    if (!form.time) { setMsg({ type: 'error', text: 'Please select a time slot.' }); return; }
    setLoading(true); setMsg(null);
    try {
      await api.post('/appointments/book', {
        patientId: uid,
        doctorId: parseInt(form.doctorId),
        date: form.date,
        time: form.time,
        type: form.type,
        reason: form.reason,
      });
      setMsg({ type: 'success', text: 'Appointment booked successfully! Redirecting…' });
      setTimeout(() => navigate('/patient'), 2000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Booking failed. Please try again.' });
    } finally { setLoading(false); }
  };

  const selectedDoctor = doctors.find(d => String(d.id) === form.doctorId);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4fb', fontFamily: "'DM Sans', -apple-system, sans-serif", display: 'flex' }}>
      {/* Left panel */}
      <div style={{ width: '380px', background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)', padding: '48px 40px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '48px', padding: 0, fontFamily: 'inherit' }}>
          ← Back
        </button>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a6ef5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>📅</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Book an Appointment</h1>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Schedule a visit with one of our qualified physicians.</p>
        </div>

        {/* Steps */}
        {['Select a doctor', 'Choose date & time', 'Pick appointment type', 'Confirm booking'].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(26,110,245,0.2)', border: '1px solid rgba(26,110,245,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#60a5fa', flexShrink: 0 }}>{i + 1}</div>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{step}</span>
          </div>
        ))}

        {/* Doctor preview */}
        {selectedDoctor && (
          <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Selected Doctor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a6ef5,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                {selectedDoctor.firstName.charAt(0)}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' }}>Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</div>
                {selectedDoctor.specialization && <div style={{ color: '#64748b', fontSize: '12px' }}>{selectedDoctor.specialization}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right form */}
      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '560px' }}>
          {msg && <Alert type={msg.type} message={msg.text} />}

          <form onSubmit={handleBook}>
            {/* Doctor select */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Doctor <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {doctors.map(d => (
                  <button key={d.id} type="button" onClick={() => setForm({ ...form, doctorId: String(d.id) })}
                    style={{
                      padding: '12px 14px', borderRadius: '12px', border: form.doctorId === String(d.id) ? '2px solid #1a6ef5' : '1.5px solid #e2e8f4',
                      background: form.doctorId === String(d.id) ? '#eff6ff' : '#ffffff', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', boxShadow: form.doctorId === String(d.id) ? '0 0 0 3px rgba(26,110,245,0.1)' : 'none',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: form.doctorId === String(d.id) ? '#1d4ed8' : '#0f172a' }}>Dr. {d.firstName} {d.lastName}</div>
                    {d.specialization && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{d.specialization}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                <DatePicker value={form.date} onChange={date => setForm({ ...form, date })} minDate={new Date().toISOString().split('T')[0]} label="" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Slot <span style={{ color: '#ef4444' }}>*</span></label>
                <TimePicker value={form.time} onChange={time => setForm({ ...form, time })} label="" />
              </div>
            </div>

            {/* Appointment type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Appointment Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {APPOINTMENT_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                    style={{
                      padding: '12px 14px', borderRadius: '12px', border: form.type === t.value ? '2px solid #1a6ef5' : '1.5px solid #e2e8f4',
                      background: form.type === t.value ? '#eff6ff' : '#ffffff', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', boxShadow: form.type === t.value ? '0 0 0 3px rgba(26,110,245,0.1)' : 'none',
                    }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{t.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: form.type === t.value ? '#1d4ed8' : '#0f172a' }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <Input label="Reason for Visit" value={form.reason} onChange={v => setForm({ ...form, reason: v })} placeholder="Briefly describe your symptoms or reason for visit…" multiline rows={3} />

            {/* Summary */}
            {form.date && form.time && form.doctorId && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Appointment Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px' }}>
                  <div><span style={{ color: '#64748b' }}>Doctor: </span><span style={{ fontWeight: '600', color: '#0f172a' }}>Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</span></div>
                  <div><span style={{ color: '#64748b' }}>Type: </span><span style={{ fontWeight: '600', color: '#0f172a' }}>{form.type.replace(/_/g, ' ')}</span></div>
                  <div><span style={{ color: '#64748b' }}>Date: </span><span style={{ fontWeight: '600', color: '#0f172a' }}>{new Date(form.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}</span></div>
                  <div><span style={{ color: '#64748b' }}>Time: </span><span style={{ fontWeight: '600', color: '#0f172a' }}>{form.time}</span></div>
                </div>
              </div>
            )}

            <Btn type="submit" variant="primary" size="lg" fullWidth disabled={loading || !form.doctorId} icon={loading ? undefined : '✓'}>
              {loading ? 'Booking…' : 'Confirm Appointment'}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}
