import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
          <SearchX className="w-12 h-12 text-slate-500" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700">Page Not Found</h2>
        <p className="text-slate-500">
          We couldn't find the page you're looking for. It might have been moved, deleted, or you may not have permission to view it.
        </p>
        <div className="pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
