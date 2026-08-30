'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { PlayCircle, FileText, ChevronLeft, CheckCircle, Award, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

// --- Interfaces ---
interface Lesson {
  id: number;
  attributes: {
    title: string;
    content: string;
    videoUrl: string;
    order: number;
  };
}

interface Course {
  id: number;
  attributes: {
    title: string;
    lessons: { data: Lesson[] };
  };
}

interface QuizItem {
  id: number;
  attributes?: {
    title: string;
    questions?: any[];
  };
  title?: string;
}

/**
 * Course Player (Student Workspace)
 * 
 * An immersive, SPA-like learning interface that combines:
 * 1. A dynamic sidebar for navigating the course's linear curriculum.
 * 2. A central rendering area supporting markdown processing and rich video embeddings.
 * 3. An optimistic UI pattern for tracking lesson completion and syncing progress server-side.
 * 4. Direct quiz and assessment integration.
 */
export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  
  // Core curriculum state
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Progress synchronization state
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [progressData, setProgressData] = useState({ percentage: 0, completed: 0, total: 0 });
  const [isToggling, setIsToggling] = useState(false);

  /**
   * Initial Data Bootstrapper
   */
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch Course & Lessons deeply populated
        const courseRes = await apiClient.get(
          `/courses/${params.courseId}?populate=lessons`
        );
        const fetchedCourse = courseRes.data.data;
        
        if (!fetchedCourse) {
          router.push('/student');
          return;
        }

        setCourse(fetchedCourse);
        
        // Ensure lessons are sorted explicitly in case Strapi ignored the query sort parameter
        const sortedLessons = fetchedCourse.attributes?.lessons?.data?.sort(
          (a: Lesson, b: Lesson) => (a.attributes?.order || 0) - (b.attributes?.order || 0)
        ) || [];
        setLessons(sortedLessons);

        // 2. Hydrate local progress state for the sidebar checkboxes
        try {
          const progressRes = await apiClient.get(
            `/progresses?filters[course]=${params.courseId}&filters[isCompleted]=true&populate=lesson&pagination[limit]=100`
          );
          
          const completedIds = progressRes.data?.data?.map(
            (p: any) => p.attributes?.lesson?.data?.id || p.lesson?.id
          ).filter(Boolean) || [];
          
          setCompletedLessonIds(completedIds);
        } catch (e) {
          console.warn('Progress fetch warning:', e);
        }

        // 3. Fetch exact percentage from the custom backend controller
        fetchPercentage();

        // 4. Fetch Quizzes for this course
        try {
          const quizzesRes = await apiClient.get('/quizzes?populate[questions]=*&populate[course]=*');
          const allQuizzes = quizzesRes.data?.data || [];
          const courseQuizzes = allQuizzes.filter((q: any) => {
            const courseObj = q.attributes?.course?.data || q.course;
            if (!courseObj) return false;
            return (
              courseObj.id == params.courseId || 
              courseObj.documentId == params.courseId
            );
          });
          setQuizzes(courseQuizzes);
        } catch (e) {
          console.warn('Quizzes fetch warning:', e);
        }

      } catch (error) {
        console.error('Failed to fetch course player data:', error);
        router.push('/student');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.courseId) fetchAllData();
  }, [params.courseId, router]);

  /**
   * Helper: Queries the custom endpoint that calculates percentages server-side.
   */
  const fetchPercentage = async () => {
    try {
      const res = await apiClient.get(`/progresses/percentage/${params.courseId}`);
      if (res.data?.percentage !== undefined) {
        setProgressData(res.data);
      } else if (res.data?.data?.percentage !== undefined) {
        setProgressData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch percentage', err);
    }
  };

  /**
   * Progress Toggle Engine
   */
  const handleToggleCompletion = async () => {
    const activeLesson = lessons[activeLessonIndex];
    if (!activeLesson || isToggling) return;

    setIsToggling(true);
    const isCurrentlyComplete = completedLessonIds.includes(activeLesson.id);
    const newStatus = !isCurrentlyComplete;

    // Optimistic UI update
    setCompletedLessonIds((prev) => 
      newStatus ? [...prev, activeLesson.id] : prev.filter((id) => id !== activeLesson.id)
    );

    try {
      await apiClient.post('/progresses', {
        data: {
          lesson: activeLesson.id,
          course: params.courseId,
          isCompleted: newStatus,
        }
      });
      fetchPercentage();
    } catch (error) {
      console.error('Failed to sync progress:', error);
      // Rollback on error
      setCompletedLessonIds((prev) => 
        isCurrentlyComplete ? [...prev, activeLesson.id] : prev.filter((id) => id !== activeLesson.id)
      );
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * YouTube / Video Embed Formatter
   */
  const renderVideo = (url: string) => {
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md mb-8 border border-slate-200">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson Video Stream"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20 text-slate-500 font-medium">
          Loading learning workspace...
        </div>
      </ProtectedLayout>
    );
  }

  if (!course) return null;

  const activeLesson = lessons[activeLessonIndex];
  const isComplete = activeLesson ? completedLessonIds.includes(activeLesson.id) : false;

  return (
    <ProtectedLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 lg:-m-8">
        
        {/* Top Navigation Bar with Dynamic Progress */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-4 w-1/3 min-w-0">
            <Link href="/student" className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-slate-900 truncate text-sm sm:text-base">
              {course.attributes?.title || 'Masterclass Curriculum'}
            </h1>
          </div>
          
          {/* Dynamic Progress Bar */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="flex justify-between w-full max-w-xs text-xs font-bold text-slate-600 mb-1">
              <span className="text-blue-600">{progressData.percentage}% Complete</span>
              <span className="text-slate-400">{progressData.completed} / {progressData.total || lessons.length} Lessons</span>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressData.percentage}%` }}
              />
            </div>
          </div>

          <div className="w-1/3 flex justify-end">
            {quizzes.length > 0 && (
              <Link
                href={`/student/courses/${params.courseId}/quizzes/${quizzes[0].documentId || quizzes[0].id}`}
                className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-blue-200"
              >
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Take Quiz</span>
              </Link>
            )}
          </div>
        </div>

        {/* Player Layout (Sidebar + Main Content) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 relative">
            {lessons.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-10 shadow-xs">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Lessons Available Yet</h2>
                <p className="text-slate-500 text-sm">The instructor has not added curriculum modules to this course yet.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 lg:p-10 mb-20">
                {activeLesson?.attributes?.videoUrl && renderVideo(activeLesson.attributes.videoUrl)}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 block">
                      Lesson {activeLessonIndex + 1} of {lessons.length}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {activeLesson?.attributes?.title}
                    </h2>
                  </div>
                  
                  {/* Mark as Complete Toggle */}
                  <button
                    onClick={handleToggleCompletion}
                    disabled={isToggling}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm disabled:opacity-50 shrink-0 ${
                      isComplete 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isComplete ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{isComplete ? 'Completed' : 'Mark as Complete'}</span>
                  </button>
                </div>
                
                {/* Markdown Lesson Content */}
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                  {activeLesson?.attributes?.content ? (
                    <ReactMarkdown>{activeLesson.attributes.content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">No additional reading notes provided for this lesson.</p>
                  )}
                </div>

                {/* Course Assessment Quiz CTA Banner */}
                {quizzes.length > 0 && (
                  <div className="mt-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-600/15">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl shrink-0">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold tracking-wide uppercase mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Assessment Ready</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold">
                          {quizzes[0]?.attributes?.title || quizzes[0]?.title || 'Course Architecture Assessment'}
                        </h3>
                        <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                          Evaluate your mastery with the server-graded multiple-choice assessment.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/student/courses/${params.courseId}/quizzes/${quizzes[0].documentId || quizzes[0].id}`}
                      className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-900 font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md shrink-0 hover:scale-105"
                    >
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Start Quiz</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </Link>
                  </div>
                )}
                
                {/* Navigation Buttons inside lesson */}
                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => setActiveLessonIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeLessonIndex === 0}
                    className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                  >
                    Previous Lesson
                  </button>
                  <button
                    onClick={() => setActiveLessonIndex(prev => Math.min(lessons.length - 1, prev + 1))}
                    disabled={activeLessonIndex === lessons.length - 1}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    Next Lesson
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lessons & Quizzes Sidebar */}
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col hidden lg:flex flex-shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Curriculum Outline</h3>
              <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {lessons.length} Modules
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {lessons.map((lesson, index) => {
                const isActive = index === activeLessonIndex;
                const isLessonComplete = completedLessonIds.includes(lesson.id);
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonIndex(index)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-start gap-3 transition-all ${
                      isActive 
                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-semibold shadow-xs' 
                        : 'hover:bg-slate-50 border border-transparent text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isLessonComplete ? 'text-emerald-600' : 'text-slate-300'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm leading-snug line-clamp-2 ${isActive ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                        {index + 1}. {lesson.attributes?.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Quizzes Section */}
            {quizzes.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/70">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  Assessments ({quizzes.length})
                </p>
                <div className="space-y-1.5">
                  {quizzes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/student/courses/${params.courseId}/quizzes/${q.documentId || q.id}`}
                      className="w-full text-left p-3 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 text-blue-900 flex items-center justify-between transition-all group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold truncate">
                          {q.attributes?.title || q.title || 'Course Quiz'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">
                        Start
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </ProtectedLayout>
  );
}
