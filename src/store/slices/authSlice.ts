import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function loadUserFromStorage(): User | null {
  try {
    // sessionStorage first (tab-specific), fallback to localStorage
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadTokenFromStorage(): string | null {
  // sessionStorage first (tab-specific), fallback to localStorage
  return sessionStorage.getItem('token') || localStorage.getItem('token') || null;
}

const savedToken = loadTokenFromStorage();
const savedUser  = loadUserFromStorage();

const initialState: AuthState = {
  user:            savedUser ?? null,
  token:           savedToken ?? null,
  isAuthenticated: !!savedToken && !!savedUser,
  loading:         false,
  error:           null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error   = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user            = action.payload.user;
      state.token           = action.payload.token;
      state.isAuthenticated = true;
      state.loading         = false;
      state.error           = null;
      // Save to BOTH storages
      // sessionStorage = tab-specific (survives refresh, isolated per tab)
      // localStorage   = fallback for single-tab usage
      sessionStorage.setItem('token', action.payload.token);
      sessionStorage.setItem('user',  JSON.stringify(action.payload.user));
      localStorage.setItem('token',   action.payload.token);
      localStorage.setItem('user',    JSON.stringify(action.payload.user));
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error   = action.payload;
    },
    logout(state) {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      state.loading         = false;
      state.error           = null;
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;