import { useState } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function DatePicker({ value, onChange, minDate, label }: DatePickerProps) {
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const min = minDate ? new Date(minDate) : today;
  min.setHours(0,0,0,0);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const selectDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < min) return;
    const str = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onChange(str);
    setOpen(false);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const displayValue = value ? new Date(value).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Select date';

  return (
    <div style={{ position:'relative' }}>
      {label && <label style={{ display:'block', color:'#6b87aa', fontSize:'11px', marginBottom:'6px', textTransform:'uppercase' }}>{label}</label>}
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width:'100%', padding:'11px 14px', background:'#060b14', border:'1px solid rgba(99,179,237,0.15)', borderRadius:'10px', color: value ? '#e2eaf7' : '#4a6080', fontSize:'14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', boxSizing:'border-box' as const }}>
        <span>{displayValue}</span>
        <span style={{ fontSize:'16px' }}>📅</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:500, marginTop:'6px', background:'#0d1626', border:'1px solid rgba(99,179,237,0.2)', borderRadius:'14px', padding:'16px', width:'280px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <button type="button" onClick={prevMonth} style={{ background:'rgba(99,179,237,0.1)', border:'none', color:'#93c5fd', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px' }}>‹</button>
            <span style={{ fontWeight:'600', color:'#e2eaf7', fontSize:'14px' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} style={{ background:'rgba(99,179,237,0.1)', border:'none', color:'#93c5fd', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'6px' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', color:'#4a6080', fontWeight:'600', padding:'4px 0' }}>{d}</div>)}
          </div>

          {/* Days */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(viewYear, viewMonth, day);
              thisDate.setHours(0,0,0,0);
              const isPast = thisDate < min;
              const isSelected = value === `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = thisDate.toDateString() === today.toDateString();

              return (
                <button type="button" key={day} onClick={() => selectDate(day)} disabled={isPast}
                  style={{ padding:'6px 2px', borderRadius:'6px', border:'none', cursor: isPast ? 'not-allowed' : 'pointer', fontSize:'12px', fontWeight: isSelected ? '700' : '400', background: isSelected ? '#2563eb' : isToday ? 'rgba(37,99,235,0.15)' : 'transparent', color: isPast ? '#2a3a50' : isSelected ? 'white' : isToday ? '#93c5fd' : '#e2eaf7' }}>
                  {day}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop:'10px', borderTop:'1px solid rgba(99,179,237,0.08)', paddingTop:'10px', display:'flex', gap:'6px' }}>
            <button type="button" onClick={() => { onChange(today.toISOString().split('T')[0]); setOpen(false); }}
              style={{ flex:1, padding:'7px', borderRadius:'8px', border:'none', background:'rgba(37,99,235,0.15)', color:'#93c5fd', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>Today</button>
            <button type="button" onClick={() => setOpen(false)}
              style={{ flex:1, padding:'7px', borderRadius:'8px', border:'none', background:'rgba(99,179,237,0.08)', color:'#6b87aa', cursor:'pointer', fontSize:'12px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
