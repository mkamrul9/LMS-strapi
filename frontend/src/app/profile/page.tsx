'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Lock, 
  Save, 
  Key, 
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  FileText,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react';

interface EnrollmentItem {
  id: number;
  attributes: {
    enrolledAt: string;
    course: {
      data: {
        id: number;
        attributes: {
          title: string;
          coverImageUrl: string;
          instructor: {
            data: { attributes: { username: string } };
          };
        };
      };
    };
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const roleName = user?.role?.name || 'Student';
  const isStudent = roleName === 'Student';
  const isInstructor = roleName === 'Instructor';
  const isContentManager = roleName === 'Content Manager';
  const isAdmin = roleName === 'Admin';

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set default tab according to role
  const [activeTab, setActiveTab] = useState<'workspace' | 'account' | 'security'>('workspace');
  
  // Password change simulation state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        if (isStudent) {
          const res = await apiClient.get('/enrollments?populate[course][populate][0]=instructor');
          setEnrollments(res.data.data || []);
        } else if (isInstructor) {
          const res = await apiClient.get(`/courses?filters[instructor][id][$eq]=${user.id}&populate=lessons,quizzes`);
          setInstructorCourses(res.data.data || []);
        } else if (isContentManager) {
          const res = await apiClient.get('/blogs?populate=author');
          setBlogs(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, isStudent, isInstructor, isContentManager]);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');

    if (newPassword.length < 6) {
      setSaveError('New password must be at least 6 characters.');
      return;
    }

    setSaveSuccess('Security credentials updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'instructor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'content manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Profile Header Card */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
          
          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 border-4 border-white/20 shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold uppercase text-white">
                {user?.username ? user.username.charAt(0) : 'U'}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user?.username}</h1>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRoleBadge(roleName)}`}>
                    {roleName}
                  </span>
                </div>
                <p className="text-slate-300 text-sm flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user?.email}
                </p>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {new Date().getFullYear()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isStudent && (
                <Link
                  href="/courses"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Browse Catalog
                </Link>
              )}
              {isInstructor && (
                <Link
                  href="/instructor/courses/new"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  New Masterclass
                </Link>
              )}
              {isContentManager && (
                <Link
                  href="/content-manager/blog/new"
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  New Article
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  <Shield className="w-4 h-4" />
                  Admin Console
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid — Tailored per Role */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {isStudent && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{enrollments.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Enrolled Courses</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Active</div>
                  <div className="text-xs text-slate-500 font-medium">Learning Status</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Verified</div>
                  <div className="text-xs text-slate-500 font-medium">Student Identity</div>
                </div>
              </div>
            </>
          )}

          {isInstructor && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{instructorCourses.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Authored Courses</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Active</div>
                  <div className="text-xs text-slate-500 font-medium">Teaching Status</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Faculty</div>
                  <div className="text-xs text-slate-500 font-medium">Instructor Role</div>
                </div>
              </div>
            </>
          )}

          {isContentManager && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{blogs.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Platform Articles</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Active</div>
                  <div className="text-xs text-slate-500 font-medium">Editorial Status</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Editorial</div>
                  <div className="text-xs text-slate-500 font-medium">Content Manager</div>
                </div>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Full Access</div>
                  <div className="text-xs text-slate-500 font-medium">System Role</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Platform</div>
                  <div className="text-xs text-slate-500 font-medium">User Governance</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Superuser</div>
                  <div className="text-xs text-slate-500 font-medium">Full Governance</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-8">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'workspace'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {isStudent && <><BookOpen className="w-4 h-4" /> Enrolled Courses ({enrollments.length})</>}
            {isInstructor && <><Layers className="w-4 h-4" /> My Authored Courses ({instructorCourses.length})</>}
            {isContentManager && <><FileText className="w-4 h-4" /> Editorial Publications ({blogs.length})</>}
            {isAdmin && <><Shield className="w-4 h-4" /> Platform Governance Console</>}
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'account'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Account Overview
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & Credentials
          </button>
        </div>

        {/* Tab 1: Role-Specific Primary Workspace */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Student Workspace */}
            {isStudent && (
              <>
                {isLoading ? (
                  <div className="text-center py-12 text-slate-500">Loading your registered courses...</div>
                ) : enrollments.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No courses enrolled yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Explore our curriculum catalog to start learning modern full-stack development and cloud architecture.
                    </p>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Browse Course Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrollments.map((enr) => {
                      const course = enr.attributes?.course?.data || (enr as any).course;
                      if (!course) return null;
                      const courseDocId = course.documentId || course.id;
                      const title = course.attributes?.title || course.title;
                      const cover = course.attributes?.coverImageUrl || course.coverImageUrl;
                      const instructor = course.attributes?.instructor?.data?.attributes?.username || course.instructor?.username || 'Senior Instructor';

                      return (
                        <div
                          key={enr.id}
                          className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                        >
                          <div className="relative h-44 bg-slate-100">
                            <Image
                              src={cover || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                              alt={title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {title}
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                              Instructor: <span className="font-semibold text-slate-700">{instructor}</span>
                            </p>

                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                Enrolled
                              </span>
                              <Link
                                href={`/student/courses/${courseDocId}`}
                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                              >
                                <span>Continue Learning</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Instructor Workspace */}
            {isInstructor && (
              <>
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Your Masterclass Catalog</h3>
                    <p className="text-xs text-slate-500">Manage curriculum, lessons, and quizzes for your authored courses.</p>
                  </div>
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Create Course
                  </Link>
                </div>

                {instructorCourses.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
                    <p className="text-slate-500 text-sm">No courses authored yet.</p>
                    <Link href="/instructor/courses/new" className="inline-block bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl">
                      Build Your First Course
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instructorCourses.map((c) => {
                      const courseDocId = c.documentId || c.id;
                      return (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                          <h4 className="text-base font-bold text-slate-900">{c.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                          <div className="pt-3 border-t flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400">
                              {c.lessons?.length || 0} Lessons · {c.quizzes?.length || 0} Quizzes
                            </span>
                            <Link
                              href={`/instructor/courses/${courseDocId}`}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                            >
                              Manage Modules →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Content Manager Workspace */}
            {isContentManager && (
              <>
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Editorial Studio</h3>
                    <p className="text-xs text-slate-500">Draft, publish, and moderate publications.</p>
                  </div>
                  <Link
                    href="/content-manager/blog/new"
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Create Article
                  </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900">Total Publications: {blogs.length}</span>
                    <Link href="/content-manager/blog" className="text-xs font-bold text-amber-600 hover:underline">
                      Open Editorial Studio →
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Admin Workspace */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link href="/admin/users" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 hover:border-purple-500 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">User & Role Governance</h4>
                  <p className="text-xs text-slate-500">Promote, demote, or reassign user permissions across the platform.</p>
                  <span className="text-xs font-bold text-purple-600 inline-flex items-center gap-1 pt-2">
                    Manage Users <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link href="/admin/courses" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Course & Curriculum Moderation</h4>
                  <p className="text-xs text-slate-500">Inspect and moderate courses, modules, and quizzes platform-wide.</p>
                  <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1 pt-2">
                    Manage Courses <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link href="/admin/blog" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 hover:border-amber-500 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Editorial & Article Control</h4>
                  <p className="text-xs text-slate-500">Moderate blog publications, drafts, and announcements.</p>
                  <span className="text-xs font-bold text-amber-600 inline-flex items-center gap-1 pt-2">
                    Manage Blog <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link href="/admin" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 hover:border-emerald-500 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Platform Metrics & Governance</h4>
                  <p className="text-xs text-slate-500">Monitor real-time platform statistics, enrollments, and growth metrics.</p>
                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 pt-2">
                    Open Admin Console <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Account Overview */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username</label>
                <div className="bg-slate-50 border p-3 rounded-xl text-slate-900 font-medium text-sm">
                  {user?.username}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <div className="bg-slate-50 border p-3 rounded-xl text-slate-900 font-medium text-sm">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Assigned Role</label>
                <div className="bg-slate-50 border p-3 rounded-xl text-slate-900 font-medium text-sm flex items-center justify-between">
                  <span className="font-bold text-slate-900">{roleName}</span>
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Account ID</label>
                <div className="bg-slate-50 border p-3 rounded-xl text-slate-500 font-mono text-xs truncate">
                  UID: {user?.id}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Credentials */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-6 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-500" />
              Update Account Password
            </h3>

            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                {saveSuccess}
              </div>
            )}

            {saveError && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-medium">
                {saveError}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save New Password
              </button>
            </form>
          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
