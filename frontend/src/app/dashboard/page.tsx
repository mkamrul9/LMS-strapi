'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Dashboard Switchboard Router
 * 
 * This component acts as a traffic director for authenticated users. Instead of a single monolithic dashboard,
 * we utilize strict Role-Based Access Control (RBAC) to redirect users to their dedicated workspaces.
 * 
 * Lifecycle:
 * 1. Component mounts in a loading state.
 * 2. It waits for the global `AuthContext` to finish hydrating the user state from Strapi.
 * 3. Once hydration completes, it inspects `user.role.name`.
 * 4. Replaces the current history entry with the appropriate workspace URL, preventing users from 
 *    using the "Back" button to return to this intermediate routing page.
 */
export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Fallback guard: If somehow accessed without auth, send to login.
        router.replace('/login');
      } else {
        // Switchboard Logic: Direct users to their specific domain.
        // Using `router.replace` instead of `router.push` prevents polluting the browser history stack.
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
            // Failsafe for unassigned or invalid roles
            router.replace('/unauthorized');
        }
      }
    }
  }, [user, isLoading, router]);

  // Render a minimal layout while the client-side redirect is calculating.
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500 font-medium text-lg">
        Loading your workspace...
      </div>
    </div>
  );
}
