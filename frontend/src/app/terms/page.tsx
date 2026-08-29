import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-8">
          <div className="border-b pb-6 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
            <p className="text-slate-500 text-xs">Last updated: August 2026</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 text-sm space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By accessing and utilizing LMSPrime, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. Academic & Code Integrity</h2>
              <p>
                All student evaluations, quiz answers, and lesson submissions must represent original work. Automated scripting or reverse-engineering of grading engines is strictly prohibited.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Intellectual Property</h2>
              <p>
                All instructional video streams, curriculum texts, design tokens, and software architecture schematics remain the proprietary intellectual property of LMSPrime and its contributing instructors.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Account Security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and JWT authorization tokens.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
