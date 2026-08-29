import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Sparkles, Users, Award, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: 'Alex Vance',
      role: 'Chief Technology Officer & Co-Founder',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: 'Former distributed systems lead with 12+ years of experience scaling modern web infrastructure.',
    },
    {
      name: 'Marcus Chen',
      role: 'Head of Curriculum & Engineering',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      bio: 'Open-source maintainer and author of multiple high-throughput database frameworks.',
    },
    {
      name: 'Elena Rostova',
      role: 'Director of Learning Experience',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      bio: 'Pioneered cognitive learning frameworks and gamified assessment architectures.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-slate-900 text-white py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Our Mission
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Democratizing World-Class Engineering Education
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              We founded LMSPrime with a single goal: build the definitive, interactive learning platform for modern full-stack engineering and cloud architectures.
            </p>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Practitioner-Led</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                All courses are designed and reviewed by principal engineers actively working in high-growth technology companies.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Zero Fluff, All Code</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We avoid superficial slide decks. Every single module requires real-world code implementation and server-side verification.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Proof of Competency</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Complete verifiable quizzes and atomic milestones that prove your architectural mastery to employers and teams.
              </p>
            </div>
          </div>

          {/* Team Grid */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900">Leadership & Curriculum Team</h2>
              <p className="text-slate-500 text-sm">The engineers and educators behind LMSPrime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                  <div className="relative h-64 bg-slate-100">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                    <div className="text-xs font-semibold text-blue-600">{member.role}</div>
                    <p className="text-xs text-slate-500 leading-relaxed pt-2">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
