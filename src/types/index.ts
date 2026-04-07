export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'LAB_TECH';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: Role;
  status: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
