import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, clearToken, getToken, setToken } from '../lib/api';

export interface AuthOperator {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  operator: AuthOperator | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<AuthOperator | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setOperator(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/api/v1/auth/me');
      if (!res.ok) {
        clearToken();
        setOperator(null);
        return;
      }
      setOperator((await res.json()) as AuthOperator);
    } catch {
      clearToken();
      setOperator(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    clearToken();
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string | { message?: string } }
        | null;
      const message =
        typeof body?.message === 'string'
          ? body.message
          : body?.message &&
              typeof body.message === 'object' &&
              'message' in body.message
            ? String(body.message.message)
            : 'Không đăng nhập được';
      throw new Error(message);
    }
    const data = (await res.json()) as {
      token: string;
      operator: AuthOperator;
    };
    setToken(data.token);
    setOperator(data.operator);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setOperator(null);
  }, []);

  const value = useMemo(
    () => ({ operator, loading, login, logout, refresh }),
    [operator, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
