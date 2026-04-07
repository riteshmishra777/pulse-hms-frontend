import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import type { RootState } from '../store/store';
import api from '../api/axiosConfig';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      dispatch(loginSuccess({
        token: data.token,
        user: {
          userId: data.userId ?? data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
        },
      }));

      const redirectMap: Record<string, string> = {
        ADMIN: '/admin',
        DOCTOR: '/doctor',
        PATIENT: '/patient',
        LAB_TECH: '/lab',
      };

      navigate(redirectMap[data.role] || '/login');

    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    background: '#f9fafb',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    marginBottom: '5px',
    color: '#374151'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(circle at top left, #bbf7d0, transparent 40%),
          radial-gradient(circle at bottom right, #86efac, transparent 40%),
          #e6f4ea
        `,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '30px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: '36px', textAlign: 'center' }}>🏥</div>

        <h1 style={{
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: '700',
          color: '#065f46',
          margin: '10px 0 5px'
        }}>
          Pulse HMS
        </h1>

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '20px'
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@hospital.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              background: 'linear-gradient(135deg,#16a34a,#22c55e)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          marginTop: '18px',
          color: '#6b7280'
        }}>
          Don’t have an account?{' '}
          <span
            style={{ color: '#16a34a', cursor: 'pointer', fontWeight: '500' }}
            onClick={() => navigate('/register')}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}