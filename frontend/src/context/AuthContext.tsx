'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';

// Define the shape of our User object based on Strapi's response
export interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkSession = async () => {
    const token = getCookie('jwt');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user data WITH role populated
      const { data } = await apiClient.get('/users/me?populate=role');
      setUser(data);
    } catch (error) {
      console.error('Session check failed', error);
      deleteCookie('jwt');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (token: string, userData: User) => {
    // Save token in cookie (expires in 7 days to match backend)
    setCookie('jwt', token, { maxAge: 60 * 60 * 24 * 7 });
    
    // We immediately fetch the /users/me endpoint to ensure we have the role
    await checkSession(); 
  };

  const logout = () => {
    deleteCookie('jwt');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
