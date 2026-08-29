'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Instructor root router page.
 * Redirects directly to the instructor course management workspace.
 */
export default function InstructorRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/courses');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500 font-medium text-lg">
        Redirecting to Instructor Workspace...
      </div>
    </div>
  );
}
