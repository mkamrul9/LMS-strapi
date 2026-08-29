import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Award, 
  Zap, 
  Star,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';

export default function Home() {
  const featuredHighlights = [
    {
      title: 'Advanced Next.js & React 19',
      category: 'Full-Stack Architecture',
      instructor: 'Senior Staff Engineer',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      rating: '4.9',
      students: '3,840',
      tag: 'Bestseller',
    },
    {
      title: 'Mastering PostgreSQL & Database Scaling',
      category: 'Backend & Data Modeling',
      instructor: 'Principal Database Architect',
      image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
      rating: '4.8',
      students: '2,910',
      tag: 'Trending',
    },
    {
      title: 'Applied AI & Machine Learning with Python',
      category: 'Artificial Intelligence',
      instructor: 'AI Research Lead',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
      rating: '5.0',
      students: '5,120',
      tag: 'New Release',
    },
  ];

  const platformPillars = [
    {
      icon: Terminal,
      title: 'Production-Grade Curriculum',
      description: 'Hands-on projects covering full-stack Next.js, relational database indexing, and cloud architectures.',
    },
    {
      icon: Zap,
      title: 'Instant Interactive Quizzes',
      description: 'Test your understanding immediately after lessons with automated server-evaluated scoring engines.',
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Workspaces',
      description: 'Dedicated portals tailored specifically for Students, Instructors, Content Managers, and Administrators.',
    },
    {
      icon: Award,
      title: 'Verified Skill Completion',
      description: 'Earn cryptographic milestones as you progress through lessons and complete curriculum requirements.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-28 lg:pt-28 lg:pb-36">
          {/* Ambient Lighting Background */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Next-Generation Engineering Education
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                  Master modern software engineering with{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
                    real-world depth
                  </span>
                </h1>

                <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Accelerate your path to senior engineer with curriculum designed around production Next.js, PostgreSQL scaling, AI workflows, and microservice infrastructure.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/courses"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2.5 group"
                  >
                    <span>Explore Course Catalog</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/register"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-7 py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
                  >
                    <span>Start Free Trial</span>
                  </Link>
                </div>

                {/* Live Stats Row */}
                <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-center lg:text-left">
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">25k+</div>
                    <div className="text-xs text-slate-400 font-medium">Active Learners</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">99.4%</div>
                    <div className="text-xs text-slate-400 font-medium">Satisfaction Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
                    <div className="text-xs text-slate-400 font-medium">Practical Code</div>
                  </div>
                </div>

              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 group">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
                      alt="Coding Workspace"
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  </div>

                  <div className="p-6 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                        Interactive Player
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        <span>4.9 / 5.0</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">Enterprise Fullstack Masterclass</h3>
                    <p className="text-xs text-slate-400">Streamed video lessons, inline interactive markdown notes, and progress analytics.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Featured Courses Preview Grid */}
        <section className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">Curated Tracks</div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Featured Engineering Programs</h2>
              </div>
              <Link
                href="/courses"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group"
              >
                <span>View all 6+ courses</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredHighlights.map((course, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-48 bg-slate-200 overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {course.tag}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {course.category}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.students} Learners</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                        <span>{course.rating}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2">
                      <Link
                        href="/courses"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Learn More</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Platform Core Pillars */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="text-blue-600 text-xs font-bold uppercase tracking-wider">The Platform Difference</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Designed for serious engineers and teams
              </h2>
              <p className="text-slate-600 text-base">
                Everything you need to master, verify, and document your technical competencies with industry standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platformPillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:border-blue-500/50 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{pillar.description}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Bottom Call-To-Action Banner */}
        <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to take your engineering capabilities to the next level?
            </h2>
            <p className="text-blue-100 text-base max-w-xl mx-auto font-normal">
              Join thousands of software engineers learning on our verified, role-based platform.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all"
              >
                Create Free Account
              </Link>
              <Link
                href="/courses"
                className="bg-blue-700 hover:bg-blue-800 text-white border border-blue-400/30 px-8 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
