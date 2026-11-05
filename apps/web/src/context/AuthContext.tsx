import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { ROLES, UserRole } from '@ocean-pulse/shared';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedVesselId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  isOperator: boolean;
  isFisherman: boolean;
  isAdmin: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  [ROLES.ADMIN]: { email: 'admin@oceanpulse.org', password: 'AdminPass123!' },
  [ROLES.SHORE_OPERATOR]: { email: 'operator@oceanpulse.org', password: 'ShorePass123!' },
  [ROLES.SUPERVISOR]: { email: 'supervisor@oceanpulse.org', password: 'SuperPass123!' },
  [ROLES.FISHERMAN]: { email: 'fisher@oceanpulse.org', password: 'FisherPass123!' },
  [ROLES.DEMO_VIEWER]: { email: 'viewer@oceanpulse.org', password: 'DemoPass123!' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ocean_pulse_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.warn('[Auth] Token expired or invalid, clearing local session.');
          localStorage.removeItem('ocean_pulse_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Default to Demo Viewer for zero-friction hackathon exploration
        try {
          const res = await api.login(DEMO_CREDENTIALS[ROLES.SHORE_OPERATOR]);
          localStorage.setItem('ocean_pulse_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (e) {
          console.warn('[Auth] Demo auto-sign-in skipped:', e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('ocean_pulse_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('ocean_pulse_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  const isOperator = user?.role === ROLES.SHORE_OPERATOR || user?.role === ROLES.SUPERVISOR || user?.role === ROLES.ADMIN;
  const isFisherman = user?.role === ROLES.FISHERMAN;
  const isAdmin = user?.role === ROLES.ADMIN;
  const isViewer = user?.role === ROLES.DEMO_VIEWER;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        isOperator,
        isFisherman,
        isAdmin,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
