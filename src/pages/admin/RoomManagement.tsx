import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import HMSLayout from '../../components/HMSLayout';
import { StatCard, Badge, Btn, Table, Tr, Td, PageContent, TopBar, Alert, Modal, Input, Select } from '../../components/UI';

interface Room { id: number; roomNumber: string; roomType: string; status: string; floor: number; pricePerDay: number; }
interface Allotment {
  id: number;
  room: Room;
  patient: { id: number; firstName: string; lastName: string };
  admissionDate: string;
  dischargeDate: string;
  status: string;
}
interface Patient { id: number; firstName: string; lastName: string; }

export default function RoomManagement() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAllot, setShowAllot] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNumber: '', roomType: 'GENERAL', floor: '1', pricePerDay: '' });
  const [allotForm, setAllotForm] = useState({ roomId: '', patientId: '', admissionDate: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [rr, ar, pr] = await Promise.allSettled([
        api.get('/rooms/all'),
        api.get('/rooms/allotments'),
        api.get('/admin/users'),
      ]);
      if (rr.status === 'fulfilled') setRooms(rr.value.data);
      if (ar.status === 'fulfilled') setAllotments(ar.value.data);
      if (pr.status === 'fulfilled') setPatients(pr.value.data.filter((u: any) => u.role === 'PATIENT'));
    } catch {}
  };

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rooms/add', { ...roomForm, floor: parseInt(roomForm.floor), pricePerDay: parseFloat(roomForm.pricePerDay) });
      showMsg('success', `Room ${roomForm.roomNumber} added successfully.`);
      setShowAddRoom(false);
      setRoomForm({ roomNumber: '', roomType: 'GENERAL', floor: '1', pricePerDay: '' });
      fetchAll();
    } catch { showMsg('error', 'Failed to add room.'); }
  };

  const allotRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rooms/allot', {
        roomId:        parseInt(allotForm.roomId),
        patientId:     parseInt(allotForm.patientId),
        admissionDate: allotForm.admissionDate,
      });
      showMsg('success', 'Room allotted successfully.');
      setShowAllot(false);
      setAllotForm({ roomId: '', patientId: '', admissionDate: '' });
      fetchAll();
    } catch { showMsg('error', 'Failed to allot room.'); }
  };

  const discharge = async (id: number) => {
    try {
      const allotment = allotments.find(a => a.id === id);
      await api.put(`/rooms/discharge/${id}`);

      if (allotment) {
        try {
          const admission  = new Date(allotment.admissionDate);
          const today      = new Date();
          const days       = Math.max(1, Math.ceil((today.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24)));
          const roomCharge = days * (allotment.room?.pricePerDay || 0);

          await api.post('/billing/generate', {
            patientId:          allotment.patient.id,
            consultationCharge: 0,
            labCharge:          0,
            pharmacyCharge:     0,
            roomCharge,
            otherCharges:       0,
          });

          showMsg('success', `✅ ${allotment.patient.firstName} discharged. Room bill of ₹${roomCharge} generated (${days} day${days > 1 ? 's' : ''} × ₹${allotment.room?.pricePerDay}/day).`);
        } catch {
          showMsg('success', '✅ Patient discharged.');
        }
      } else {
        showMsg('success', '✅ Patient discharged.');
      }

      fetchAll();
    } catch { showMsg('error', 'Failed to discharge patient.'); }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 5000);
  };

  const available = rooms.filter(r => r.status === 'AVAILABLE');
  const occupied  = rooms.filter(r => r.status === 'OCCUPIED');
  const active    = allotments.filter(a => a.status === 'ACTIVE');

  const navItems = [
    { id: 'overview', icon: '🏠', label: 'Overview',        path: '/admin',         badge: undefined, onTabChange: (_: string) => navigate('/admin') },
    { id: 'users',    icon: '👥', label: 'User Management', path: '/admin',         badge: undefined, onTabChange: (_: string) => navigate('/admin?tab=users') },
    { id: 'rooms',    icon: '🛏️', label: 'Room Management', path: '/admin/rooms',   badge: undefined },
    { id: 'billing',  icon: '💰', label: 'Billing',         path: '/admin/billing', badge: undefined },
  ];

  const roomTypeColors: Record<string, string> = {
    GENERAL:   '#1a6ef5',
    PRIVATE:   '#8b5cf6',
    ICU:       '#ef4444',
    EMERGENCY: '#f59e0b',
    OPERATION: '#10b981',
  };

  return (
    <HMSLayout navItems={navItems} role="ADMIN">
      <TopBar title="Room Management" subtitle="Manage hospital rooms and patient allotments" />
      <PageContent>
        {msg && <Alert type={msg.type} message={msg.text} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <StatCard icon="🛏️" label="Total Rooms"    value={rooms.length}     color="#052e16" />
          <StatCard icon="✅"  label="Available"      value={available.length} color="#10b981" />
          <StatCard icon="🔴"  label="Occupied"       value={occupied.length}  color="#ef4444" />
          <StatCard icon="👥"  label="Active Patients" value={active.length}   color="#16a34a" />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ id: 'rooms', label: '🛏️ Rooms' }, { id: 'allotments', label: '👥 Allotments' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: '1.5px solid',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  borderColor: activeTab === tab.id ? '#16a34a' : '#e2e8f4',
                  background:  activeTab === tab.id ? '#f0fdf4' : '#fff',
                  color:       activeTab === tab.id ? '#15803d' : '#64748b',
                }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn variant="secondary" size="sm" icon="🛏️" onClick={() => setShowAddRoom(true)}>Add Room</Btn>
            <Btn variant="primary"   size="sm" icon="+"   onClick={() => setShowAllot(true)}>Allot Room</Btn>
          </div>
        </div>

        {activeTab === 'rooms' && (
          <Table
            headers={['Room No.', 'Type', 'Floor', 'Status', 'Price/Day']}
            isEmpty={rooms.length === 0}
            empty={{ icon: '🛏️', message: 'No rooms added yet.', action: <Btn variant="primary" onClick={() => setShowAddRoom(true)}>Add Room</Btn> }}
          >
            {rooms.map(r => (
              <Tr key={r.id}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${roomTypeColors[r.roomType] || '#94a3b8'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🛏️</div>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{r.roomNumber}</span>
                  </div>
                </Td>
                <Td>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `${roomTypeColors[r.roomType] || '#94a3b8'}15`, color: roomTypeColors[r.roomType] || '#64748b' }}>
                    {r.roomType}
                  </span>
                </Td>
                <Td style={{ color: '#475569' }}>Floor {r.floor}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td style={{ color: '#16a34a', fontWeight: '700', fontSize: '15px' }}>
                  ₹{r.pricePerDay}<span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>/day</span>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        {activeTab === 'allotments' && (
          <Table
            headers={['Patient', 'Room', 'Room Type', 'Admitted', 'Days', 'Est. Charge', 'Status', 'Action']}
            isEmpty={allotments.length === 0}
            empty={{ icon: '👥', message: 'No allotments yet.', action: <Btn variant="primary" onClick={() => setShowAllot(true)}>Allot Room</Btn> }}
          >
            {allotments.map(a => {
              const days = Math.max(1, Math.ceil((new Date().getTime() - new Date(a.admissionDate).getTime()) / (1000 * 60 * 60 * 24)));
              const estCharge = days * (a.room?.pricePerDay || 0);
              return (
                <Tr key={a.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>
                        {a.patient?.firstName?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '600' }}>{a.patient?.firstName} {a.patient?.lastName}</span>
                    </div>
                  </Td>
                  <Td style={{ fontWeight: '700' }}>{a.room?.roomNumber}</Td>
                  <Td>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `${roomTypeColors[a.room?.roomType] || '#94a3b8'}15`, color: roomTypeColors[a.room?.roomType] || '#64748b' }}>
                      {a.room?.roomType}
                    </span>
                  </Td>
                  <Td style={{ color: '#475569' }}>{a.admissionDate}</Td>
                  <Td>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {days} day{days > 1 ? 's' : ''}
                    </span>
                  </Td>
                  <Td style={{ color: '#f59e0b', fontWeight: '700' }}>₹{estCharge}</Td>
                  <Td><Badge status={a.status} /></Td>
                  <Td>
                    {a.status === 'ACTIVE' && (
                      <Btn variant="danger" size="sm" onClick={() => discharge(a.id)}>
                        Discharge & Bill
                      </Btn>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </PageContent>

      {showAddRoom && (
        <Modal title="Add New Room" icon="🛏️" onClose={() => setShowAddRoom(false)}>
          <form onSubmit={addRoom}>
            <Input label="Room Number" value={roomForm.roomNumber} onChange={v => setRoomForm({ ...roomForm, roomNumber: v })} placeholder="e.g. A-101" required />
            <Select label="Room Type" value={roomForm.roomType} onChange={v => setRoomForm({ ...roomForm, roomType: v })}
              options={['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY', 'OPERATION'].map(t => ({ value: t, label: t }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Floor"             value={roomForm.floor}       onChange={v => setRoomForm({ ...roomForm, floor: v })}       type="number" placeholder="1"   required />
              <Input label="Price per Day (₹)" value={roomForm.pricePerDay} onChange={v => setRoomForm({ ...roomForm, pricePerDay: v })} type="number" placeholder="500" required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="secondary" onClick={() => setShowAddRoom(false)} fullWidth>Cancel</Btn>
              <Btn type="submit" variant="primary" fullWidth icon="🛏️">Add Room</Btn>
            </div>
          </form>
        </Modal>
      )}

      {showAllot && (
        <Modal title="Allot Room to Patient" icon="+" onClose={() => setShowAllot(false)}>
          <form onSubmit={allotRoom}>
            <Select label="Patient" value={allotForm.patientId} onChange={v => setAllotForm({ ...allotForm, patientId: v })} required
              placeholder="Select patient…"
              options={patients.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` }))} />
            <Select label="Room" value={allotForm.roomId} onChange={v => setAllotForm({ ...allotForm, roomId: v })} required
              placeholder="Select available room…"
              options={available.map(r => ({ value: String(r.id), label: `${r.roomNumber} — ${r.roomType} (₹${r.pricePerDay}/day)` }))} />
            <Input label="Admission Date" value={allotForm.admissionDate} onChange={v => setAllotForm({ ...allotForm, admissionDate: v })} type="date" required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="secondary" onClick={() => setShowAllot(false)} fullWidth>Cancel</Btn>
              <Btn type="submit" variant="primary" fullWidth icon="+">Allot Room</Btn>
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