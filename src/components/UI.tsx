import { useState } from 'react';

// ── Stat Card ──────────────────────────────────────────────
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
  trend?: string;
  onClick?: () => void;
}
export function StatCard({ icon, label, value, color = '#16a34a', bg, trend, onClick }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff', borderRadius: '16px',
        padding: 'clamp(12px, 2vw, 20px)',
        boxShadow: hovered ? '0 8px 24px rgba(15,23,42,0.12)' : '0 2px 8px rgba(15,23,42,0.06)',
        border: '1px solid #bbf7d0', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease', transform: hovered && onClick ? 'translateY(-2px)' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 'clamp(34px, 4vw, 44px)', height: 'clamp(34px, 4vw, 44px)', borderRadius: '12px', background: bg || `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(16px, 2vw, 20px)' }}>{icon}</div>
        {trend && <span style={{ fontSize: '11px', fontWeight: '600', color: trend.startsWith('+') ? '#10b981' : '#ef4444', background: trend.startsWith('+') ? '#d1fae5' : '#fee2e2', padding: '2px 8px', borderRadius: '20px' }}>{trend}</span>}
      </div>
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: '700', color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────
const badgeColors: Record<string, { bg: string; text: string }> = {
  SCHEDULED:     { bg: '#dbeafe', text: '#1d4ed8' },
  COMPLETED:     { bg: '#d1fae5', text: '#065f46' },
  CANCELLED:     { bg: '#fee2e2', text: '#991b1b' },
  PENDING:       { bg: '#fef3c7', text: '#92400e' },
  PAID:          { bg: '#d1fae5', text: '#065f46' },
  PARTIALLY_PAID:{ bg: '#dbeafe', text: '#1d4ed8' },
  IN_PROGRESS:   { bg: '#ede9fe', text: '#4c1d95' },
  DISPENSED:     { bg: '#d1fae5', text: '#065f46' },
  AVAILABLE:     { bg: '#d1fae5', text: '#065f46' },
  OCCUPIED:      { bg: '#fee2e2', text: '#991b1b' },
  MAINTENANCE:   { bg: '#fef3c7', text: '#92400e' },
  ACTIVE:        { bg: '#dbeafe', text: '#1d4ed8' },
  DISCHARGED:    { bg: '#f1f5f9', text: '#475569' },
  APPROVED:      { bg: '#d1fae5', text: '#065f46' },
  PENDING_APPROVAL: { bg: '#fef3c7', text: '#92400e' },
  SUSPENDED:     { bg: '#fee2e2', text: '#991b1b' },
};

export function Badge({ status }: { status: string }) {
  const c = badgeColors[status] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
      background: c.bg, color: c.text, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.text, display: 'inline-block' }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Page Header ────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: string;
}
export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon && (
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a6ef515', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icon}</div>
        )}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0', fontWeight: '400' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Primary Button ─────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: string;
  fullWidth?: boolean;
}
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', icon, fullWidth }: BtnProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const styles: Record<string, { bg: string; color: string; border: string; hoverBg: string }> = {
    primary: { bg: '#16a34a', color: '#fff', border: 'none', hoverBg: '#15803d' },
    success: { bg: '#dcfce7', color: '#166534', border: '1px solid #86efac', hoverBg: '#bbf7d0' },
    secondary: { bg: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f4', hoverBg: '#e2e8f4' },
    danger:    { bg: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', hoverBg: '#fecaca' },
    ghost:     { bg: 'transparent', color: '#475569', border: '1px solid #e2e8f4', hoverBg: '#f8fafc' },
   
  };
  const sizes: Record<string, { padding: string; fontSize: string; borderRadius: string }> = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '8px' },
    md: { padding: '9px 18px', fontSize: '13px', borderRadius: '10px' },
    lg: { padding: '12px 24px', fontSize: '14px', borderRadius: '12px' },
  };
  const s = styles[variant];
  const sz = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...sz, background: hovered ? s.hoverBg : s.bg, color: s.color,
        border: s.border, cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : 'auto',
        justifyContent: fullWidth ? 'center' : 'flex-start',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: variant === 'primary' && !disabled ? '0 2px 8px rgba(26,110,245,0.3)' : 'none',
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}
export function Card({ children, title, subtitle, action, padding = '20px', style }: CardProps) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f4',
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden', ...style,
    }}>
      {(title || action) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {title && <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  empty?: { icon: string; message: string; action?: React.ReactNode };
  isEmpty?: boolean;
}
export function Table({ headers, children, empty, isEmpty }: TableProps) {
  if (isEmpty && empty) {
    return (
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f4', padding: '60px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{empty.icon}</div>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>{empty.message}</p>
        {empty.action}
      </div>
    );
  }
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f4', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8faff', borderBottom: '1px solid #e2e8f4' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderBottom: '1px solid #f1f5f9', background: hovered ? '#f8faff' : '#fff', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', verticalAlign: 'middle', ...style }}>{children}</td>
  );
}

// ── Input ──────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  icon?: string;
}
export function Input({ label, value, onChange, placeholder, type = 'text', required, multiline, rows = 3, icon }: InputProps) {
  const [focused, setFocused] = useState(false);
  const baseStyle: React.CSSProperties = {
    width: '100%', padding: icon ? '10px 14px 10px 36px' : '10px 14px',
    background: focused ? '#ffffff' : '#f8faff',
    border: focused ? '1.5px solid #1a6ef5' : '1.5px solid #e2e8f4',
    borderRadius: '10px', fontSize: '13px', color: '#0f172a',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    transition: 'all 0.15s ease', boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px rgba(26,110,245,0.1)' : 'none',
  };
  return (
    <div style={{ marginBottom: '14px', position: 'relative' }}>
      {label && <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>{icon}</span>}
        {multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} required={required}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ ...baseStyle, resize: 'vertical', minHeight: `${rows * 28}px` }} />
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={baseStyle} />
        )}
      </div>
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}
export function Select({ label, value, onChange, options, required, placeholder }: SelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px', background: focused ? '#ffffff' : '#f8faff',
          border: focused ? '1.5px solid #1a6ef5' : '1.5px solid #e2e8f4',
          borderRadius: '10px', fontSize: '13px', color: value ? '#0f172a' : '#94a3b8',
          fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer',
          transition: 'all 0.15s', boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(26,110,245,0.1)' : 'none',
          appearance: 'none',
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}
export function Modal({ title, subtitle, icon, onClose, children, width = '480px' }: ModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: width,
        boxShadow: '0 20px 60px rgba(15,23,42,0.2)', animation: 'fadeInUp 0.25s ease',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{title}</div>
              {subtitle && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Alert ──────────────────────────────────────────────────
export function Alert({ type = 'info', message }: { type?: 'success' | 'error' | 'warning' | 'info'; message: string }) {
  const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '❌' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: 'ℹ️' },
  };
  const s = styles[type];
  return (
    <div style={{ padding: '12px 16px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <span>{s.icon}</span> {message}
    </div>
  );
}

// ── Page Wrapper ───────────────────────────────────────────
export function PageContent({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 'clamp(14px, 3vw, 28px) clamp(14px, 4vw, 32px)', flex: 1, animation: 'fadeInUp 0.3s ease both' }}>
      {children}
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────
export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div style={{
      background: '#ffffff', borderBottom: '1px solid #bbf7d0',
      padding: '0 clamp(16px, 4vw, 32px)',
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(5,46,22,0.06)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(to bottom, #16a34a, #4ade80)', borderRadius: '2px', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', fontWeight: '800', color: '#052e16', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500' }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ fontSize: '11px', color: '#4ade80', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '20px', fontWeight: '500', whiteSpace: 'nowrap' }}>
          📅 {dateStr}
        </div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', flexShrink: 0 }} />
      </div>
    </div>
  );
}
