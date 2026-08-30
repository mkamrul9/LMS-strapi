'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Trash2, HelpCircle, BookOpen, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Course Manager Page (Instructor/Content Manager)
 * Fixed for Strapi V5 flat response format.
 */
export default function CourseManagerPage() {
  const params = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '' });
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  const fetchCourse = async () => {
    try {
      const response = await apiClient.get(`/courses/${params.id}?populate=lessons,quizzes`);
      setCourse(response.data.data);
    } catch (error) {
      console.error(error);
      router.push('/instructor/courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchCourse();
  }, [params.id]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLesson(true);

    // Strapi V5: flat data, no .attributes wrapper
    const currentLessons = course?.lessons || [];
    const nextOrder = currentLessons.length > 0 
      ? Math.max(...currentLessons.map((l: any) => l.order || 0)) + 1 
      : 1;

    try {
      await apiClient.post('/lessons', {
        data: {
          ...lessonForm,
          course: params.id,
          order: nextOrder,
          publishedAt: new Date().toISOString()
        }
      });
      
      setLessonForm({ title: '', videoUrl: '', content: '' });
      setIsAddingLesson(false);
      toast.success('Lesson created successfully!');
      await fetchCourse();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create lesson');
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string | number) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/lessons/${lessonId}`);
      toast.success('Lesson deleted');
      await fetchCourse();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete lesson');
    }
  };

  const handleDeleteQuiz = async (quizId: string | number) => {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted');
      await fetchCourse();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete quiz');
    }
  };

  if (isLoading) return (
    <ProtectedLayout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </ProtectedLayout>
  );

  if (!course) return null;

  // Strapi V5 flat response - no .attributes wrapper
  const courseTitle = course.title;
  const courseDocId = course.documentId || course.id;
  const lessons = course.lessons || [];
  const quizzes = course.quizzes || [];

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Course Manager</p>
              <h1 className="text-2xl font-extrabold text-slate-900">{courseTitle}</h1>
              <p className="text-sm text-slate-500 mt-1">{lessons.length} lessons · {quizzes.length} quizzes</p>
            </div>
            <Link
              href={`/courses/${courseDocId}`}
              target="_blank"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
            >
              View Live →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Lesson Builder */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                Curriculum ({lessons.length} Lessons)
              </h2>
              {!isAddingLesson && (
                <button
                  onClick={() => setIsAddingLesson(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Lesson
                </button>
              )}
            </div>

            {isAddingLesson && (
              <form onSubmit={handleCreateLesson} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-lg text-slate-900 border-b pb-3">New Lesson</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lesson Title *</label>
                  <input
                    required
                    type="text"
                    value={lessonForm.title}
                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Introduction to React Hooks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Video URL <span className="text-slate-400 font-normal">(YouTube link)</span></label>
                  <input
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
                  <textarea
                    rows={5}
                    value={lessonForm.content}
                    onChange={e => setLessonForm({...lessonForm, content: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="# Lesson Notes&#10;&#10;Write your lesson content here..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLesson(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLesson}
                    className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {isSubmittingLesson ? 'Saving...' : 'Save Lesson'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {lessons.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No lessons yet</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Add Lesson" to start building your curriculum</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lessons.map((lesson: any, index: number) => (
                    <li key={lesson.id || lesson.documentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{lesson.title}</p>
                          {lesson.videoUrl && (
                            <p className="text-xs text-slate-400 truncate">📹 Video attached</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLesson(lesson.documentId || lesson.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column: Quiz Manager */}
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Quizzes ({quizzes.length})
              </h2>
              <Link
                href={`/instructor/courses/${courseDocId}/quizzes/new`}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-purple-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Quiz
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {quizzes.length === 0 ? (
                <div className="p-10 text-center">
                  <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No quizzes yet</p>
                  <p className="text-slate-400 text-xs mt-1">Add an assessment to test student knowledge</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {quizzes.map((quiz: any) => (
                    <li key={quiz.id || quiz.documentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{quiz.title}</p>
                          <p className="text-xs text-slate-400">{quiz.questions?.length || 0} questions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.documentId || quiz.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-800">Quick Actions</p>
              <Link
                href={`/instructor/courses/${courseDocId}/quizzes/new`}
                className="block w-full text-center text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-colors"
              >
                + Create Assessment
              </Link>
              <Link
                href="/instructor/courses"
                className="block w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 transition-colors"
              >
                ← Back to My Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
