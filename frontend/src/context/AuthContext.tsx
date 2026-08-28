'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';

/**
 * Standardized User object structure reflecting Strapi's user model augmented with relations.
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    name: string;
  };
}

/**
 * Blueprint for the AuthContext, defining the state and lifecycle methods available to consumers.
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** Initiates a local session using the provided JWT and user metadata */
  login: (token: string, userData: User) => Promise<void>;
  /** Clears the local session and redirects the user */
  logout: () => void;
  /** Validates the current JWT against the backend to ensure the session is still active and untampered */
  checkSession: () => Promise<void>;
}

// Instantiate the context with an undefined default, forcing consumers to be wrapped in the Provider.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider wraps the application and manages the global authentication state.
 * It acts as the single source of truth for the user's session and role.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // isLoading acts as a hydration barrier, preventing protected routes from flashing 
  // before the initial session check completes.
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Verifies the user's session by checking for a local JWT and validating it against the Strapi backend.
   * This ensures that if a user's role changes on the backend, or their account is deleted, 
   * the frontend will immediately reflect it on the next hard reload.
   */
  const checkSession = async () => {
    const token = getCookie('jwt');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch the deep-populated user object to retrieve role data securely.
      const { data } = await apiClient.get('/users/me?populate=role');
      setUser(data);
      
      // We replicate the backend role into a cookie so the Next.js Edge Middleware
      // can perform instant synchronous routing without needing to await a database query.
      if (data.role?.name) {
        setCookie('userRole', data.role.name, { maxAge: 60 * 60 * 24 * 7 });
      }
    } catch (error) {
      // If the backend rejects the token (e.g. expired or invalid), we aggressively clean up the local state.
      console.error('Session check failed', error);
      deleteCookie('jwt');
      deleteCookie('userRole');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the session verification immediately on client-side hydration.
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Completes the login handshake by persisting the JWT and fetching the canonical user state.
   * 
   * @param token - The JWT returned from Strapi
   * @param userData - The initial user payload returned from Strapi
   */
  const login = async (token: string, userData: User) => {
    // 7-day persistent session
    setCookie('jwt', token, { maxAge: 60 * 60 * 24 * 7 });
    if (userData.role?.name) {
      setCookie('userRole', userData.role.name, { maxAge: 60 * 60 * 24 * 7 });
    }
    // Re-verify against the backend to hydrate full state
    await checkSession();
  };

  /**
   * Terminates the session by destroying local cookies and forcing a redirect to the login gate.
   */
  const logout = () => {
    deleteCookie('jwt');
    deleteCookie('userRole');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the AuthContext cleanly.
 * @throws {Error} if used outside of an AuthProvider hierarchy.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
