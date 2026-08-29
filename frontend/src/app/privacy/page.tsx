import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-8">
          <div className="border-b pb-6 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500 text-xs">Last updated: August 2026</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 text-sm space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Data We Collect</h2>
              <p>
                We collect your account email, username, course enrollment history, and atomic lesson progress markers strictly to facilitate your learning journey.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. How We Protect Your Data</h2>
              <p>
                All sensitive credentials and database transactions are secured using industry-standard bcrypt encryption, HTTPS TLS 1.3 in transit, and role-based token authentication.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Third-Party Sharing</h2>
              <p>
                We do not sell, rent, or monetize your personal information to third-party ad networks under any circumstance.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
