import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth:user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('auth:user', JSON.stringify(user));
    else localStorage.removeItem('auth:user');
  }, [user]);

  const login = (u) => setUser(u);
  const logout = () => setUser(null);

  const role = user?.role ?? null;

  const isAdmin = () => role === 'admin';
  const isReception = () => role === 'reception';
  const isHousekeeping = () => role === 'housekeeping';
  const isGuest = () => role === 'guest';

  const value = useMemo(() => ({
    user,
    role,
    login,
    logout,
    isAdmin,
    isReception,
    isHousekeeping,
    isGuest,
  }), [user, role]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
