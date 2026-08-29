'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the interactive quiz grading engine work?',
      a: 'Quizzes are submitted via atomic POST requests to our Strapi v5 backend, which securely evaluates your answers against encrypted keys on the server and calculates your score with zero exposure to the client browser.',
    },
    {
      q: 'Can I access the courses after enrollment forever?',
      a: 'Yes! Once you enroll in any course, your student profile maintains permanent access to all associated lessons, video streams, and interactive progress markers.',
    },
    {
      q: 'What roles exist on the LMS platform?',
      a: 'Our platform enforces multi-tenant Role-Based Access Control (RBAC): Students can enroll and take quizzes, Instructors can author courses and lessons, Content Managers can publish blogs, and Admins oversee platform analytics.',
    },
    {
      q: 'Are certificates provided upon course completion?',
      a: 'Yes, once you mark 100% of a course lessons complete and pass the final evaluation quiz, a verifiable completion badge is added to your Profile overview.',
    },
    {
      q: 'How do I upgrade or change my subscription?',
      a: 'You can change your subscription tier anytime from the Pricing page or your Profile account settings with zero cancellation penalties.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5" />
              Got Questions?
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Everything you need to know about our curriculum, interactive player, and verification credentials.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-6 text-left font-bold text-slate-900 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still have questions card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 text-center space-y-4 shadow-lg">
            <h3 className="text-xl font-bold">Still have questions?</h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Can't find the answer you're looking for? Our friendly engineering support team is available 24/7.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Our Support Team
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
