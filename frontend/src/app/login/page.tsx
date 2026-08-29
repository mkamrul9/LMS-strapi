'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/local', {
        identifier: identifier.trim(),
        password: password,
      });

      // Fetch user with role
      const userRes = await apiClient.get('/users/me?populate=role', {
        headers: {
          Authorization: `Bearer ${response.data.jwt}`,
        },
      });

      await login(response.data.jwt, userRes.data);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Invalid email/username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string) => {
    setIdentifier(email);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border rounded-xl shadow-sm p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Welcome Back</h1>
          <p className="text-slate-500 text-sm text-center mb-6">Sign in to access your dashboard</p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email or Username</label>
              <input
                required
                type="text"
                placeholder="e.g. student@test.com or student_user"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border p-2.5 rounded-md focus:ring-slate-900 focus:outline-none focus:border-slate-900 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                required
                type="password"
                placeholder="Password123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2.5 rounded-md focus:ring-slate-900 focus:outline-none focus:border-slate-900 text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-2.5 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick 1-Click Demo Accounts (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student@test.com')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded text-left transition-colors flex flex-col"
              >
                <span className="font-semibold">Student</span>
                <span className="text-slate-500 truncate">student@test.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('instructor@test.com')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded text-left transition-colors flex flex-col"
              >
                <span className="font-semibold">Instructor</span>
                <span className="text-slate-500 truncate">instructor@test.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@test.com')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded text-left transition-colors flex flex-col"
              >
                <span className="font-semibold">Admin</span>
                <span className="text-slate-500 truncate">admin@test.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@test.com')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded text-left transition-colors flex flex-col"
              >
                <span className="font-semibold">Content Manager</span>
                <span className="text-slate-500 truncate">manager@test.com</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
