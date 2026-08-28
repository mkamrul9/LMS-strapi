'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react'; // Standardized icon library

/**
 * Global Navigation Bar Component
 * 
 * A fully responsive top-level navigation bar that reacts instantly to the user's authentication state.
 * Uses the `useAuth` hook to conditionally render guest links (Login/Register) or 
 * authenticated actions (Dashboard/Logout).
 */
export default function Navbar() {
  // Extract user state and logout handler from the global auth context.
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Brand Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-slate-900">
              LMS Platform
            </Link>
          </div>
          
          {/* Main Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link href="/courses" className="text-slate-600 hover:text-slate-900">
              Catalog
            </Link>
            <Link href="/blog" className="text-slate-600 hover:text-slate-900">
              Blog
            </Link>
            
            {/* Conditional Rendering based on Auth State */}
            {user ? (
              // Authenticated View
              <div className="flex items-center space-x-4 ml-4 border-l pl-4">
                <Link href="/dashboard" className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              // Guest View
              <div className="flex items-center space-x-4 ml-4 border-l pl-4">
                <Link href="/login" className="text-sm font-medium text-slate-900">
                  Log in
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
