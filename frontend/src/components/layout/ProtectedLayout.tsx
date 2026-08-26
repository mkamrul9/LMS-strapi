'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react';

// Define which links belong to which roles
const ROLE_LINKS = {
  Admin: [
    { name: 'Platform Stats', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'All Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
  ],
  'Content Manager': [
    { name: 'Dashboard', href: '/content-manager', icon: LayoutDashboard },
    { name: 'Course Library', href: '/content-manager/courses', icon: BookOpen },
    { name: 'Blog Manager', href: '/content-manager/blog', icon: FileText },
  ],
  Instructor: [
    { name: 'My Dashboard', href: '/instructor', icon: LayoutDashboard },
    { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Student Progress', href: '/instructor/progress', icon: Users },
  ],
  Student: [
    { name: 'My Learning', href: '/student', icon: LayoutDashboard },
    { name: 'Course Catalog', href: '/courses', icon: BookOpen },
  ],
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !user.role) return null; // Middleware will handle the redirect

  // Safely extract links for the current role
  const links = ROLE_LINKS[user.role.name as keyof typeof ROLE_LINKS] || [];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="text-xl font-bold text-slate-900">
            LMS Platform
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {user.role.name} Portal
            </p>
          </div>
          <nav className="px-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header Placeholder */}
        <header className="h-16 border-b bg-white flex items-center px-4 md:hidden">
          <span className="font-bold text-lg">LMS Platform</span>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
