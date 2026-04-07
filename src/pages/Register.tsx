import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [role,    setRole]    = useState('PATIENT');

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', password:'',
    phone:'', dateOfBirth:'', specialization:'',
    licenseNumber:'', experience:'',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form, role,
        experience: form.experience ? parseInt(form.experience) : undefined,
      };
      const res = await api.post('/auth/register', payload);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width:'100%',
    padding:'11px 14px',
    border:'1px solid #d1d5db',
    borderRadius:'10px',
    background:'#f9fafb',
    fontSize:'14px',
    boxSizing:'border-box',
    outline:'none'
  };

  const labelStyle: React.CSSProperties = {
    display:'block',
    fontSize:'12px',
    marginBottom:'5px',
    color:'#374151'
  };

  return (
    <div
      style={{
        position:'fixed',
        top:0,
        left:0,
        width:'100vw',
        height:'100dvh',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        overflow:'hidden',
        background:`
          radial-gradient(circle at top left, #bbf7d0, transparent 40%),
          radial-gradient(circle at bottom right, #86efac, transparent 40%),
          #e6f4ea
        `,
        padding:'20px'
      }}
    >
      <div
        style={{
          background:'#ffffff',
          borderRadius:'20px',
          padding:'30px',
          width:'100%',
          maxWidth:'480px',
          boxShadow:'0 10px 30px rgba(0,0,0,0.08)',
          border:'1px solid #e5e7eb',
        }}
      >
        <h1 style={{ textAlign:'center', fontSize:'24px', fontWeight:'700', color:'#065f46' }}>
          Create Account
        </h1>

        <p style={{ textAlign:'center', fontSize:'13px', color:'#6b7280', marginBottom:'20px' }}>
          Join Pulse HMS
        </p>

        {/* ROLE SWITCH */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
          {['PATIENT','DOCTOR'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                flex:1,
                padding:'10px',
                borderRadius:'10px',
                cursor:'pointer',
                border:'1px solid #d1d5db',
                background: role===r ? '#dcfce7' : '#f9fafb',
                color: role===r ? '#166534' : '#6b7280',
                fontWeight:'500'
              }}
            >
              {r === 'PATIENT' ? 'Patient' : 'Doctor'}
            </button>
          ))}
        </div>

        {role === 'DOCTOR' && (
          <div style={{
            background:'#f0fdf4',
            border:'1px solid #bbf7d0',
            borderRadius:'8px',
            padding:'10px',
            fontSize:'13px',
            color:'#166534',
            marginBottom:'16px'
          }}>
            Doctor accounts require admin approval before login
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input style={inputStyle} name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input style={inputStyle} name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input style={inputStyle} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
            </div>
          </div>

          {role === 'DOCTOR' && (
            <>
              <div style={{ marginBottom:'14px' }}>
                <label style={labelStyle}>Specialization</label>
                <input style={inputStyle} name="specialization" value={form.specialization} onChange={handleChange} required />
              </div>
            </>
          )}

          <div style={{ marginBottom:'14px' }}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>

          {error && <p style={{ color:'#dc2626', fontSize:'13px' }}>{error}</p>}
          {success && <p style={{ color:'#16a34a', fontSize:'13px' }}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:'12px',
              marginTop:'10px',
              background:'linear-gradient(135deg,#16a34a,#22c55e)',
              border:'none',
              borderRadius:'10px',
              color:'white',
              fontWeight:'600',
              cursor:'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:'13px', marginTop:'18px', color:'#6b7280' }}>
          Already have an account?{' '}
          <span style={{ color:'#16a34a', cursor:'pointer' }} onClick={() => navigate('/login')}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}