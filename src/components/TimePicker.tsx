import { useState } from 'react';

interface TimePickerProps {
  value: string; // HH:MM
  onChange: (time: string) => void;
  label?: string;
}

const SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30',
  '17:00','17:30','18:00',
];

const format12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
};

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position:'relative' }}>
      {label && <label style={{ display:'block', color:'#6b87aa', fontSize:'11px', marginBottom:'6px', textTransform:'uppercase' }}>{label}</label>}
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width:'100%', padding:'11px 14px', background:'#060b14', border:'1px solid rgba(99,179,237,0.15)', borderRadius:'10px', color: value ? '#e2eaf7' : '#4a6080', fontSize:'14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', boxSizing:'border-box' as const }}>
        <span>{value ? format12(value) : 'Select time'}</span>
        <span style={{ fontSize:'16px' }}>🕐</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:500, marginTop:'6px', background:'#0d1626', border:'1px solid rgba(99,179,237,0.2)', borderRadius:'14px', padding:'12px', width:'220px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', maxHeight:'260px', overflowY:'auto' }}>
          <div style={{ fontSize:'11px', color:'#4a6080', textTransform:'uppercase', marginBottom:'8px', padding:'0 4px' }}>Available Slots</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
            {SLOTS.map(slot => {
              const isSelected = value === slot;
              return (
                <button type="button" key={slot} onClick={() => { onChange(slot); setOpen(false); }}
                  style={{ padding:'8px', borderRadius:'8px', border: isSelected ? '1px solid #2563eb' : '1px solid rgba(99,179,237,0.1)', background: isSelected ? '#2563eb' : 'rgba(99,179,237,0.05)', color: isSelected ? 'white' : '#93c5fd', cursor:'pointer', fontSize:'12px', fontWeight: isSelected ? '700' : '400' }}>
                  {format12(slot)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
