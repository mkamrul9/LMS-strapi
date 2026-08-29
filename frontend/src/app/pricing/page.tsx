import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Check, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Community Free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for beginners exploring foundational web development topics.',
      features: [
        'Access to all open introductory lessons',
        'Standard community discussion forum',
        'Basic browser quiz evaluations',
        'Single device login stream',
      ],
      cta: 'Get Started Free',
      href: '/register',
      highlighted: false,
    },
    {
      name: 'Pro Engineer',
      price: '$29',
      period: 'per month',
      description: 'Full unlimited access to every advanced masterclass and quiz track.',
      features: [
        'Unlimited access to all 6+ masterclasses',
        'Complete interactive quizzes & solution repos',
        'Full progress analytics & tracking dashboard',
        'Priority instructor Q&A review',
        'Verified cryptographic certificate of completion',
      ],
      cta: 'Start 14-Day Free Trial',
      href: '/register',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Enterprise Teams',
      price: '$99',
      period: 'per seat / month',
      description: 'Engineered for scaling engineering teams and corporate training programs.',
      features: [
        'Everything in Pro for entire organization',
        'Dedicated Admin & Content Manager dashboards',
        'Custom internal course authoring tools',
        'SAML SSO & enterprise security compliance',
        'Dedicated success architect and SLA',
      ],
      cta: 'Contact Enterprise Sales',
      href: '/contact',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Invest in your engineering future
            </h1>
            <p className="text-slate-600 text-base sm:text-lg">
              No hidden fees or lock-ins. Cancel or switch plans anytime with one click.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-blue-500 scale-105 lg:-translate-y-2'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-lg'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className={`text-xs font-medium ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                      /{plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm pt-4 border-t border-slate-200/20">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={plan.highlighted ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href={plan.href}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all block ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
