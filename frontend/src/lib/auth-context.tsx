'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  country_code: string;
  preferred_language: string;
  account_status: string;
  is_admin: boolean;
  must_change_password: boolean;
  email_verified: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('fi_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      localStorage.removeItem('fi_access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, newUser: User) => {
    localStorage.setItem('fi_access_token', token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('fi_access_token');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    return user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
