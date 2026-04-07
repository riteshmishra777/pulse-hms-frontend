import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'LAB_TECH';

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

function normalizeRole(raw: any): Role | null {
  if (!raw) return null;
  const r = String(raw).toUpperCase().replace('ROLE_', '').trim();
  if (r === 'ADMIN')                       return 'ADMIN';
  if (r === 'DOCTOR')                      return 'DOCTOR';
  if (r === 'PATIENT')                     return 'PATIENT';
  if (r === 'LAB_TECH' || r === 'LABTECH') return 'LAB_TECH';
  return null;
}

function getUserFromSession(): any {
  try {
    // sessionStorage is tab-specific — this is the fix for multi-tab
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getUserFromLocal(): any {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getRoleFromToken(tokenStr?: string | null): Role | null {
  try {
    const token = tokenStr || sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const raw = payload.role ?? payload.roles?.[0] ?? payload.authority ?? payload.authorities?.[0] ?? null;
    return normalizeRole(raw);
  } catch { return null; }
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Priority: sessionStorage (tab-specific) > Redux > localStorage
  const sessionToken = sessionStorage.getItem('token');
  const sessionUser  = getUserFromSession();
  const localUser    = getUserFromLocal();

  const token       = sessionToken || localStorage.getItem('token');
  const currentUser = user ?? sessionUser ?? localUser;

  // No token anywhere = not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // No user data anywhere = session broken, re-login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Get role — priority: currentUser.role > token decode
  const role =
    normalizeRole(currentUser?.role) ??
    getRoleFromToken(token);

  // Can't determine role = go to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role for this route
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}