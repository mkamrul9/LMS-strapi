'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  GraduationCap, 
  UserCircle,
  Menu,
  X,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';

// Unified Role Navigation Matrix
const ROLE_LINKS = {
  Admin: [
    { name: 'Platform Stats', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'All Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ],
  'Content Manager': [
    { name: 'Editorial Dashboard', href: '/content-manager/blog', icon: LayoutDashboard },
    { name: 'Course Library', href: '/content-manager/courses', icon: BookOpen },
    { name: 'Blog Manager', href: '/content-manager/blog', icon: FileText },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ],
  Instructor: [
    { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Student Progress', href: '/instructor/progress', icon: Users },
    { name: 'Browse Catalog', href: '/courses', icon: Layers },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ],
  Student: [
    { name: 'My Learning', href: '/student', icon: LayoutDashboard },
    { name: 'Course Catalog', href: '/courses', icon: BookOpen },
    { name: 'Engineering Blog', href: '/blog', icon: FileText },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ],
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !user.role) return null;

  const links = ROLE_LINKS[user.role.name as keyof typeof ROLE_LINKS] || [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 hidden md:flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                LMS<span className="text-blue-400">Prime</span>
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="py-6 px-4 space-y-6">
            <div className="px-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {user.role.name} Workspace
              </p>
            </div>
            
            <nav className="space-y-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.name}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/20 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs md:hidden flex">
          <div className="w-72 bg-slate-900 text-white p-6 flex flex-col justify-between h-full shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base">LMSPrime</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-6 space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 bg-red-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">LMSPrime</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
