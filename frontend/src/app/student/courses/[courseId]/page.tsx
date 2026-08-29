'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { PlayCircle, FileText, ChevronLeft, CheckCircle } from 'lucide-react';
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

/**
 * Course Player (Student Workspace)
 * 
 * An immersive, SPA-like learning interface that combines:
 * 1. A dynamic sidebar for navigating the course's linear curriculum.
 * 2. A central rendering area supporting markdown processing and rich video embeddings.
 * 3. An optimistic UI pattern for tracking lesson completion and syncing progress server-side.
 */
export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  
  // Core curriculum state
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Progress synchronization state
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [progressData, setProgressData] = useState({ percentage: 0, completed: 0, total: 0 });
  const [isToggling, setIsToggling] = useState(false);

  /**
   * Initial Data Bootstrapper
   * Fetches the Course, sorts the Lessons by order, fetches the User's local progress arrays,
   * and queries the backend for the mathematically accurate completion percentage.
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
        const sortedLessons = fetchedCourse.attributes.lessons?.data.sort(
          (a: Lesson, b: Lesson) => a.attributes.order - b.attributes.order
        ) || [];
        setLessons(sortedLessons);

        // 2. Hydrate local progress state for the sidebar checkboxes
        const progressRes = await apiClient.get(
          `/progresses?filters[course]=${params.courseId}&filters[isCompleted]=true&populate=lesson&pagination[limit]=100`
        );
        
        // Extract array of completed lesson IDs for fast local lookup during renders
        const completedIds = progressRes.data.data.map(
          (p: any) => p.attributes.lesson?.data?.id
        ).filter(Boolean);
        
        setCompletedLessonIds(completedIds);

        // 3. Fetch exact percentage from the custom backend controller to drive the progress bar UI
        fetchPercentage();

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
   * Helper: Queries the custom endpoint designed in Phase 08 that calculates percentages serverside.
   */
  const fetchPercentage = async () => {
    try {
      const res = await apiClient.get(`/progresses/percentage/${params.courseId}`);
      setProgressData(res.data);
    } catch (err) {
      console.error('Failed to fetch percentage', err);
    }
  };

  /**
   * Action: Atomic Toggle Completion
   * Reverses the completion state of the active lesson.
   * Uses an optimistic UI pattern: immediately updates local state, fires background POST, 
   * and subsequently resyncs the global progress bar percentage.
   */
  const handleToggleCompletion = async () => {
    if (lessons.length === 0) return;
    
    const activeLessonId = lessons[activeLessonIndex].id;
    const isCurrentlyCompleted = completedLessonIds.includes(activeLessonId);
    const newCompletionState = !isCurrentlyCompleted;

    setIsToggling(true);

    try {
      // Hit our atomic upsert endpoint
      await apiClient.post('/progresses', {
        data: {
          lesson: activeLessonId,
          course: params.courseId,
          isCompleted: newCompletionState
        }
      });

      // Optimistically update local array to provide instant visual feedback to the student
      if (newCompletionState) {
        setCompletedLessonIds(prev => [...prev, activeLessonId]);
      } else {
        setCompletedLessonIds(prev => prev.filter(id => id !== activeLessonId));
      }

      // Re-fetch the server-side percentage to keep the progress bar perfectly accurate
      await fetchPercentage();

    } catch (error) {
      console.error('Failed to toggle progress:', error);
      alert('Failed to save progress. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * Render Helper: Determines if the video URL is from an embeddable platform (Youtube/Vimeo)
   * or a direct HTML5 video source and wraps it in a responsive container.
   */
  const renderVideo = (videoUrl: string) => {
    if (!videoUrl) return null;
    const isYouTubeOrVimeo = videoUrl.includes('youtube.com') || videoUrl.includes('vimeo.com');
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md mb-8">
        {isYouTubeOrVimeo ? (
          <iframe
            src={videoUrl}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={videoUrl} controls className="absolute top-0 left-0 w-full h-full object-contain" />
        )}
      </div>
    );
  };

  // --- Core Render Returns ---

  if (isLoading) {
    return <ProtectedLayout><div className="flex justify-center py-20 text-slate-500">Loading course...</div></ProtectedLayout>;
  }

  if (!course) return null;

  const activeLesson = lessons[activeLessonIndex];
  const isComplete = activeLesson ? completedLessonIds.includes(activeLesson.id) : false;

  return (
    <ProtectedLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 lg:-m-8">
        
        {/* Top Navigation Bar with Progress */}
        <div className="h-16 border-b bg-white flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-4 w-1/3">
            <Link href="/student" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-slate-900 line-clamp-1">{course.attributes.title}</h1>
          </div>
          
          {/* Dynamic Progress Bar */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="flex justify-between w-full max-w-xs text-xs font-medium text-slate-500 mb-1">
              <span>{progressData.percentage}% Complete</span>
              <span>{progressData.completed} / {progressData.total} Lessons</span>
            </div>
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressData.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="w-1/3"></div> {/* Spacer for flex balance */}
        </div>

        {/* Player Layout (Sidebar + Main Content) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 relative">
            {lessons.length === 0 ? (
              <div className="bg-white border rounded-lg p-12 text-center max-w-2xl mx-auto mt-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Lessons Yet</h2>
                <p className="text-slate-500">The instructor has not added any content to this course yet.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white border rounded-xl shadow-sm p-6 lg:p-8 mb-20">
                {activeLesson.attributes.videoUrl && renderVideo(activeLesson.attributes.videoUrl)}
                
                <div className="flex justify-between items-start mb-6 border-b pb-6">
                  <h2 className="text-3xl font-bold text-slate-900">
                    {activeLessonIndex + 1}. {activeLesson.attributes.title}
                  </h2>
                  
                  {/* Mark as Complete Toggle */}
                  <button
                    onClick={handleToggleCompletion}
                    disabled={isToggling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors text-sm disabled:opacity-50 ${
                      isComplete 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isComplete ? 'text-green-600' : 'text-slate-400'}`} />
                    {isComplete ? 'Completed' : 'Mark as Complete'}
                  </button>
                </div>
                
                <div className="prose prose-slate max-w-none">
                  {activeLesson.attributes.content ? (
                    <ReactMarkdown>{activeLesson.attributes.content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">No text content provided.</p>
                  )}
                </div>
                
                {/* Navigation Buttons inside lesson */}
                <div className="mt-12 pt-6 border-t flex justify-between items-center">
                  <button
                    onClick={() => setActiveLessonIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeLessonIndex === 0}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    Previous Lesson
                  </button>
                  <button
                    onClick={() => setActiveLessonIndex(prev => Math.min(lessons.length - 1, prev + 1))}
                    disabled={activeLessonIndex === lessons.length - 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Next Lesson
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lessons Sidebar */}
          <div className="w-80 border-l bg-white flex flex-col hidden lg:flex flex-shrink-0">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-900">Course Content</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const isActive = index === activeLessonIndex;
                  const isLessonComplete = completedLessonIds.includes(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(index)}
                      className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors ${
                        isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`mt-0.5 ${isLessonComplete ? 'text-green-500' : 'text-slate-300'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                          {index + 1}. {lesson.attributes.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </ProtectedLayout>
  );
}
