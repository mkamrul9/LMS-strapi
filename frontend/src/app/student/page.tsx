'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { PlayCircle, BookOpen, Sparkles, ArrowRight, Layers, Award } from 'lucide-react';

interface Enrollment {
  id: number;
  attributes: {
    enrolledAt: string;
    course: {
      data: {
        id: number;
        documentId?: string;
        attributes: {
          title: string;
          description: string;
          coverImageUrl: string;
          instructor: {
            data: { attributes: { username: string } };
          };
        };
      };
    };
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await apiClient.get(
          '/enrollments?populate[course][populate][0]=instructor&populate[course][populate][1]=quizzes&populate[course][populate][2]=lessons'
        );
        setEnrollments(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <ProtectedLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Student Learning Space
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.username}
            </h1>
            <p className="text-slate-500 text-sm">
              Pick up where you left off or test your knowledge with course assessments.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Full Catalog</span>
          </Link>
        </div>

        {/* Learning Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading enrolled courses...
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 sm:p-16 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No active course enrollments yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Explore our curated curriculum covering React 19, PostgreSQL, AI & Machine Learning, and Cloud Architecture.
            </p>
            <Link
              href="/courses"
              className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Explore Courses & Enroll
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrollments.map((enrollment: any) => {
              // Support both Strapi V4 (attributes.course.data) and V5 (course flat)
              const course = enrollment.attributes?.course?.data || enrollment.course;
              if (!course) return null;

              // Normalize course data
              const title = course.attributes?.title || course.title;
              const description = course.attributes?.description || course.description;
              const coverImageUrl = course.attributes?.coverImageUrl || course.coverImageUrl;
              const instructorName = course.attributes?.instructor?.data?.attributes?.username || course.instructor?.username || 'Senior Instructor';
              const courseNavId = course.documentId || course.id;
              const quizzes = course.quizzes || course.attributes?.quizzes?.data || [];
              const lessons = course.lessons || course.attributes?.lessons?.data || [];

              return (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <Image
                        src={coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                        alt={title || 'Enrolled Course'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Instructor: <strong className="text-slate-700">{instructorName}</strong></span>
                        <div className="flex items-center gap-1.5">
                          {quizzes.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              <Award className="w-3 h-3" /> Quiz
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{description}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-4 space-y-2">
                    <Link
                      href={`/student/courses/${courseNavId}`}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Learn Modules</span>
                    </Link>

                    {quizzes.length > 0 && (
                      <Link
                        href={`/student/courses/${courseNavId}/quizzes/${quizzes[0].documentId || quizzes[0].id}`}
                        className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Take Course Quiz</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
