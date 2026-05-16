import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  display_name: string;
  role: number;
  status: number;
  quota: number;
  group: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await api.get('/user/self');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch {
      // ignore
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.post('/user/login', { username, password });
    if (!res.data.success) throw new Error(res.data.message || '登录失败');
    const { token, data } = res.data;
    localStorage.setItem('token', token);
    if (data) {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
