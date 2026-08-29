'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  GraduationCap, 
  BookOpen, 
  Edit3, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/local', {
        identifier: identifier.trim(),
        password: password,
      });

      const jwt = response.data?.jwt;
      let user = response.data?.user;

      if (!jwt) {
        throw new Error('Authentication failed: No token returned by server.');
      }

      // Fetch user with role safely
      try {
        const userRes = await apiClient.get('/users/me?populate=role', {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (userRes.data) {
          user = userRes.data;
        }
      } catch (meErr) {
        console.warn('Could not hydrate role via /users/me, falling back to login user payload', meErr);
      }

      await login(jwt, user);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError(
          'Network Error: Unable to reach the backend server. If running on Vercel, verify that NEXT_PUBLIC_API_URL is configured in your Vercel Project Settings to your Railway URL and your Railway deployment is active.'
        );
      } else {
        const serverMsg = err.response?.data?.error?.message;
        setError(
          serverMsg || 
          err.message || 
          'Invalid email/username or password. Please verify your credentials or use a 1-click demo account below.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string, roleName: string) => {
    setIdentifier(email);
    setPassword('Password123!');
    setSelectedRole(roleName);
    setError('');
  };

  const demoAccounts = [
    {
      role: 'Student',
      email: 'student@test.com',
      badge: 'Learner Portal',
      icon: GraduationCap,
      color: 'blue',
      desc: 'Browse courses, take quizzes, track progress',
    },
    {
      role: 'Instructor',
      email: 'instructor@test.com',
      badge: 'Faculty Studio',
      icon: BookOpen,
      color: 'indigo',
      desc: 'Author courses, curriculum & monitor students',
    },
    {
      role: 'Content Manager',
      email: 'manager@test.com',
      badge: 'Editorial Studio',
      icon: Edit3,
      color: 'purple',
      desc: 'Publish blogs, moderate course content',
    },
    {
      role: 'Admin',
      email: 'admin@test.com',
      badge: 'Governance',
      icon: ShieldCheck,
      color: 'amber',
      desc: 'Full platform metrics & user role promotion',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />
      
      <main className="flex-1 relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative w-full max-w-xl space-y-8">
          
          {/* Header Section */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Tenant Authentication</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome back to <span className="text-blue-600">LMSPrime</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Sign in to your role-specific dashboard or use a 1-click pre-seeded demo account.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-10 space-y-6">
            
            {/* Error Notification */}
            {error && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-900">Authentication Failed</p>
                  <p className="text-rose-700 text-xs leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="e.g. student@test.com or student_user"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setSelectedRole(null);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <span className="text-xs text-slate-400">Default: Password123!</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  1-Click Demo Personas
                </p>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Pre-Seeded Accounts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleQuickFill(item.email, item.role)}
                      className={`group relative text-left p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 ${
                        isSelected 
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs' 
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 group-hover:text-blue-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.role}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {item.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Sign Up Link */}
            <div className="pt-2 text-center text-xs text-slate-500">
              <span>New to LMSPrime? </span>
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Create a student account
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
