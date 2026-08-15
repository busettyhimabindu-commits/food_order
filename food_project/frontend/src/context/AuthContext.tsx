import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserPreference } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  preference: UserPreference | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendSignupOTP: (email: string, name: string) => Promise<any>;
  verifyOTP: (email: string, otp_code: string) => Promise<any>;
  registerWithOTP: (name: string, email: string, otp_code: string, password: string, phone?: string, role?: string, referral_code?: string) => Promise<any>;
  register: (name: string, email: string, password: string, phone?: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUserPreference: (pref: Partial<UserPreference>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          const prefData = await authService.getPreferences();
          setPreference(prefData);
        } catch (error) {
          console.error('Failed to load user auth:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    authService.getPreferences().then(setPreference).catch(() => {});
    return res.user;
  };

  const sendSignupOTP = async (email: string, name: string) => {
    return await authService.sendSignupOTP(email, name);
  };

  const verifyOTP = async (email: string, otp_code: string) => {
    return await authService.verifyOTP(email, otp_code);
  };

  const registerWithOTP = async (name: string, email: string, otp_code: string, password: string, phone?: string, role?: string, referral_code?: string) => {
    const res = await authService.registerWithOTP(name, email, otp_code, password, phone, role, referral_code);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    authService.getPreferences().then(setPreference).catch(() => {});
    return res.user;
  };

  const register = async (name: string, email: string, password: string, phone?: string, role?: string) => {
    const res = await authService.register(name, email, password, phone, role);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    authService.getPreferences().then(setPreference).catch(() => {});
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPreference(null);
  };

  const updateUserPreference = async (pref: Partial<UserPreference>) => {
    const updated = await authService.updatePreferences(pref);
    setPreference(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, preference, loading, login, sendSignupOTP, verifyOTP, registerWithOTP, register, logout, updateUserPreference }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
