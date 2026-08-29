'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Content Manager root router page.
 * Redirects directly to the content manager blog management workspace.
 */
export default function ContentManagerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/content-manager/blog');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500 font-medium text-lg">
        Redirecting to Content Manager CMS...
      </div>
    </div>
  );
}
