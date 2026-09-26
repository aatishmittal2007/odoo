import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => Promise<void>;
  logout: () => void;
  switchRole: (role: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('stocksense_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('stocksense_token');
      const savedUser = localStorage.getItem('stocksense_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('stocksense_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('stocksense_token', newToken);
    localStorage.setItem('stocksense_user', JSON.stringify(newUser));
  };

  const demoLogin = async (role: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF' = 'INVENTORY_MANAGER') => {
    const res = await api.post('/auth/demo-login', { role });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('stocksense_token', newToken);
    localStorage.setItem('stocksense_user', JSON.stringify(newUser));
  };

  const switchRole = async (role: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => {
    await demoLogin(role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
