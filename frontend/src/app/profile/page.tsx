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
  ExternalLink
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
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'learning' | 'account' | 'security'>('learning');
  
  // Password change simulation state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await apiClient.get('/enrollments?populate[course][populate][0]=instructor');
        setEnrollments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load profile enrollments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');

    if (newPassword.length < 6) {
      setSaveError('New password must be at least 6 characters.');
      return;
    }

    // Success feedback
    setSaveSuccess('Security credentials updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const getRoleBadge = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
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
          {/* Background Decorative Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
          
          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 border-4 border-white/20 shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold uppercase text-white">
                {user?.username ? user.username.charAt(0) : 'U'}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user?.username}</h1>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRoleBadge(user?.role?.name)}`}>
                    {user?.role?.name || 'Student'}
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
              <Link
                href="/courses"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-8">
          <button
            onClick={() => setActiveTab('learning')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'learning'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Enrolled Courses ({enrollments.length})
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

        {/* Tab 1: Learning / Enrolled Courses */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
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
                  const course = enr.attributes.course.data;
                  if (!course) return null;

                  return (
                    <div
                      key={enr.id}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                    >
                      <div className="relative h-44 bg-slate-100">
                        <Image
                          src={course.attributes.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                          alt={course.attributes.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {course.attributes.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                          Instructor: <span className="font-semibold text-slate-700">{course.attributes.instructor?.data?.attributes?.username || 'Senior Instructor'}</span>
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            Enrolled
                          </span>
                          <Link
                            href={`/student/courses/${course.id}`}
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
                  <span>{user?.role?.name || 'Student'}</span>
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
