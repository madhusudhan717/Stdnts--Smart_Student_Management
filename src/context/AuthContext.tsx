import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  student: Student | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Student>) => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stdnts_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStudent = async () => {
    try {
      const res = await api.get<{ student: Student }>('/auth/me');
      setStudent(res.student);
    } catch (err) {
      console.warn('Failed to fetch authenticated student session:', err);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stdnts_token');
      if (storedToken) {
        try {
          const res = await api.get<{ student: Student }>('/auth/me');
          setStudent(res.student);
          setToken(storedToken);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post<{ token: string; student: Student }>('/auth/login', {
      identifier,
      password,
    });
    localStorage.setItem('stdnts_token', res.token);
    setToken(res.token);
    setStudent(res.student);
  };

  const logout = () => {
    localStorage.removeItem('stdnts_token');
    setToken(null);
    setStudent(null);
  };

  const updateProfile = async (data: Partial<Student>) => {
    const res = await api.put<{ student: Student }>('/auth/profile', data);
    setStudent(res.student);
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        isAuthenticated: !!student && !!token,
        isLoading,
        login,
        logout,
        updateProfile,
        refreshStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
