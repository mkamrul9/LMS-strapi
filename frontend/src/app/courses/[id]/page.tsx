'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { PlayCircle, Lock, CheckCircle, ArrowLeft, BookOpen, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CourseDetails {
  id: number;
  documentId?: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  instructor?: any;
  lessons?: any[];
  quizzes?: any[];
  attributes?: {
    title: string;
    description: string;
    coverImageUrl: string;
    instructor?: {
      data: { attributes: { username: string } };
    };
    lessons?: {
      data: Array<{
        id: number;
        attributes: { title: string; order: number };
      }>;
    };
    quizzes?: {
      data: Array<{
        id: number;
        attributes: { title: string };
      }>;
    };
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        // 1. Fetch Course Data with Instructor, Lessons, and Quizzes
        const courseRes = await apiClient.get(
          `/courses/${params.id}?populate[instructor]=true&populate[lessons]=true&populate[quizzes]=true`
        );
        setCourse(courseRes.data.data);

        // 2. If user is logged in, check if already enrolled
        if (user && courseRes.data.data) {
          const courseId = courseRes.data.data.id;
          const enrollRes = await apiClient.get('/enrollments');
          const isUserEnrolled = (enrollRes.data.data || []).some((enr: any) => {
            const enrolledCourseId = enr.course?.id || enr.attributes?.course?.data?.id;
            return enrolledCourseId === courseId;
          });
          if (isUserEnrolled) {
            setIsEnrolled(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch course data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchCourseAndEnrollment();
  }, [params.id, user]);

  const handleEnrollAction = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const targetCourseId = course?.id || params.id;

    if (isEnrolled) {
      router.push(`/student/courses/${targetCourseId}`);
      return;
    }

    try {
      setIsEnrolling(true);
      await apiClient.post('/enrollments', {
        data: { course: targetCourseId }
      });
      setIsEnrolled(true);
      router.push(`/student/courses/${targetCourseId}`);
    } catch (error: any) {
      console.error('Enrollment failed:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to enroll in this course.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24 text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading masterclass curriculum...
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Course Not Found</h2>
          <p className="text-slate-500 text-sm max-w-md">
            The requested course could not be located or may have been archived.
          </p>
          <Link
            href="/courses"
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Course Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Strapi V5 flat OR V4 attributes
  const courseTitle = course.attributes?.title || (course as any).title;
  const courseDesc = course.attributes?.description || (course as any).description;
  const courseCover = course.attributes?.coverImageUrl || (course as any).coverImageUrl;
  const instructorName = course.attributes?.instructor?.data?.attributes?.username || (course as any).instructor?.username || 'Senior Instructor';
  const rawLessons = course.attributes?.lessons?.data || (course as any).lessons || [];
  const rawQuizzes = course.attributes?.quizzes?.data || (course as any).quizzes || [];
  const sortedLessons = [...rawLessons].sort((a: any, b: any) => (a.attributes?.order || a.order || 0) - (b.attributes?.order || b.order || 0));
  
  // Non-students can view but NOT enroll (per spec)
  const canEnroll = !user || user.role?.name === 'Student';
  const isNonStudent = user && user.role?.name !== 'Student';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>

          <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
            <div className="flex-1 space-y-4">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                Verified Masterclass
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                {courseTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <span>
                  Instructor: <span className="text-white font-semibold">{instructorName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  {sortedLessons.length} Modules
                </span>
                {rawQuizzes.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-purple-300 font-semibold">
                      <Star className="w-4 h-4 text-purple-400" />
                      {rawQuizzes.length} Assessment{rawQuizzes.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  4.9 Rating
                </span>
              </div>

              <div className="pt-4">
                {isNonStudent ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl text-sm font-semibold border border-slate-600">
                    <Lock className="w-4 h-4" />
                    Enrollment is for Students only
                  </div>
                ) : (
                  <button 
                    onClick={handleEnrollAction}
                    disabled={isEnrolling}
                    className={`px-8 py-3.5 rounded-xl font-bold text-base transition-all flex items-center gap-2.5 shadow-lg ${
                      isEnrolled 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 disabled:opacity-50'
                    }`}
                  >
                    {isEnrolling ? (
                      'Enrolling...'
                    ) : isEnrolled ? (
                      <><CheckCircle className="w-5 h-5" /> Continue Learning</>
                    ) : (
                      <><PlayCircle className="w-5 h-5" /> Enroll in Course</>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="w-full lg:w-96 aspect-video relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-950 flex-shrink-0">
               <Image
                  src={courseCover || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                  alt={courseTitle || 'Course'}
                  fill
                  className="object-cover"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum & About Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">About This Program</h2>
          <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed">
            <ReactMarkdown>{courseDesc || 'No description provided.'}</ReactMarkdown>
          </div>
        </div>
        
        {/* Curriculum Column */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sticky top-24 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900">Curriculum</h3>
              <span className="text-xs text-slate-500 font-semibold">{sortedLessons.length} Lessons</span>
            </div>
            
            <ul className="space-y-3">
              {sortedLessons.map((lesson: any, index: number) => (
                <li key={lesson.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="mt-0.5 text-slate-400">
                    {isEnrolled ? <PlayCircle className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${isEnrolled ? 'text-slate-900' : 'text-slate-700'}`}>
                      {index + 1}. {lesson.attributes?.title || lesson.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {rawQuizzes.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Assessment</div>
                {rawQuizzes.map((quiz: any) => (
                  <div key={quiz.id} className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-purple-900">
                    <span className="text-xs font-bold">{quiz.title || quiz.attributes?.title || 'Course Quiz'}</span>
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Included</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
