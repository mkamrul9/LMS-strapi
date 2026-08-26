import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <h2 className="text-2xl font-semibold text-slate-900">Access Denied</h2>
        <p className="text-slate-600">
          Your current role does not have permission to view this page. If you believe this is an error, please contact the platform administrator.
        </p>
        <div className="pt-6">
          <Link 
            href="/dashboard" 
            className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
