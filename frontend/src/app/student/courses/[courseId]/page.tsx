'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { PlayCircle, FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

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
    lessons: {
      data: Lesson[];
    };
  };
}

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course and sort lessons sequentially
        const response = await apiClient.get(
          `/courses/${params.courseId}?populate=lessons&sort[lessons][order]=asc`
        );
        const fetchedCourse = response.data.data;
        
        if (!fetchedCourse) {
          router.push('/student');
          return;
        }

        setCourse(fetchedCourse);
        
        const sortedLessons = fetchedCourse.attributes.lessons?.data.sort(
          (a: Lesson, b: Lesson) => a.attributes.order - b.attributes.order
        ) || [];
        
        setLessons(sortedLessons);
      } catch (error) {
        console.error('Failed to fetch course player data:', error);
        router.push('/student');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.courseId) fetchCourseData();
  }, [params.courseId, router]);

  // Helper to render responsive video
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
          <video 
            src={videoUrl} 
            controls 
            className="absolute top-0 left-0 w-full h-full object-contain"
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-20 text-slate-500">Loading course player...</div>
      </ProtectedLayout>
    );
  }

  if (!course) return null;

  const activeLesson = lessons[activeLessonIndex];

  return (
    <ProtectedLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 lg:-m-8">
        
        {/* Top Navigation Bar */}
        <div className="h-14 border-b bg-white flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/student" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-slate-900 line-clamp-1">{course.attributes.title}</h1>
          </div>
          {/* Progress placeholder for Phase 20 */}
          <div className="text-sm font-medium text-slate-500">
            Progress Tracking Coming Next
          </div>
        </div>

        {/* Player Layout (Sidebar + Main Content) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
            {lessons.length === 0 ? (
              <div className="bg-white border rounded-lg p-12 text-center max-w-2xl mx-auto mt-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Lessons Yet</h2>
                <p className="text-slate-500">The instructor has not added any content to this course yet. Please check back later.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white border rounded-xl shadow-sm p-6 lg:p-8">
                {activeLesson.attributes.videoUrl && renderVideo(activeLesson.attributes.videoUrl)}
                
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  {activeLessonIndex + 1}. {activeLesson.attributes.title}
                </h2>
                
                <div className="prose prose-slate max-w-none">
                  {activeLesson.attributes.content ? (
                    <ReactMarkdown>{activeLesson.attributes.content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">No text content provided for this lesson.</p>
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
              <p className="text-xs text-slate-500 mt-1">{lessons.length} Lessons</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const isActive = index === activeLessonIndex;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(index)}
                      className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors ${
                        isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                        {lesson.attributes.videoUrl ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
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
