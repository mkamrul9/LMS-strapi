'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Switchboard Logic
        switch (user.role?.name) {
          case 'Admin':
            router.replace('/admin');
            break;
          case 'Content Manager':
            router.replace('/content-manager');
            break;
          case 'Instructor':
            router.replace('/instructor');
            break;
          case 'Student':
            router.replace('/student');
            break;
          default:
            router.replace('/unauthorized');
        }
      }
    }
  }, [user, isLoading, router]);

  // Render a minimal loading state while the redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500 font-medium text-lg">
        Loading your workspace...
      </div>
    </div>
  );
}
