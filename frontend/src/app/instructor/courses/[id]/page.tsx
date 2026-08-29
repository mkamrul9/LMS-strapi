'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

/**
 * Course Manager Page (Instructor/Admin)
 * 
 * Provides a comprehensive dashboard for instructors to manage a specific course's curriculum.
 * Features include:
 * - Dynamic lesson creation (Video, Text via Markdown).
 * - Curriculum ordering based on existing lesson count.
 * - Quiz assignment management.
 */
export default function CourseManagerPage() {
  const params = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Lesson Builder Form State
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '' });
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  /**
   * Fetches the core course entity deeply populated with its relational branches (Lessons & Quizzes).
   * Sorts lessons sequentially by their `order` attribute.
   */
  const fetchCourse = async () => {
    try {
      const response = await apiClient.get(
        `/courses/${params.id}?populate=lessons,quizzes`
      );
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

  /**
   * Handles the submission of a new lesson.
   * Calculates the sequential `order` dynamically by finding the maximum existing order and incrementing by 1.
   * This prevents sorting conflicts without requiring a complex drag-and-drop reordering system.
   */
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLesson(true);
    const currentLessons = course?.attributes?.lessons?.data || [];
    const nextOrder = currentLessons.length > 0 ? Math.max(...currentLessons.map((l: any) => l.attributes.order)) + 1 : 1;

    try {
      await apiClient.post('/lessons', { data: { ...lessonForm, order: nextOrder, course: params.id }});
      
      // Reset form state on success
      setLessonForm({ title: '', videoUrl: '', content: '' });
      setIsAddingLesson(false);
      
      // Refresh curriculum tree
      await fetchCourse();
    } catch (error: any) {
      alert('Failed to create lesson');
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  /**
   * Hard-deletes a lesson from the curriculum.
   */
  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Delete this lesson?')) return;
    await apiClient.delete(`/lessons/${lessonId}`);
    await fetchCourse();
  };

  /**
   * Hard-deletes a quiz attachment.
   */
  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Delete this quiz?')) return;
    await apiClient.delete(`/quizzes/${quizId}`);
    await fetchCourse();
  };

  if (isLoading) return <ProtectedLayout><div className="py-20 text-center">Loading...</div></ProtectedLayout>;
  if (!course) return null;

  const lessons = course.attributes.lessons?.data || [];
  const quizzes = course.attributes.quizzes?.data || [];

  return (
    <ProtectedLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Course: {course.attributes.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lesson Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Curriculum</h2>
            {!isAddingLesson && (
              <button onClick={() => setIsAddingLesson(true)} className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800">
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            )}
          </div>

          {isAddingLesson && (
            <form onSubmit={handleCreateLesson} className="bg-white border rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">New Lesson</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Lesson Title *</label><input required type="text" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full border p-2 rounded" /></div>
                <div><label className="block text-sm font-medium mb-1">Video URL</label><input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="w-full border p-2 rounded" /></div>
                <div><label className="block text-sm font-medium mb-1">Text Content (Markdown)</label><textarea rows={4} value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} className="w-full border p-2 rounded" /></div>
                <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAddingLesson(false)} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded">Cancel</button><button type="submit" disabled={isSubmittingLesson} className="px-3 py-1.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded">Save Lesson</button></div>
              </div>
            </form>
          )}

          <div className="bg-white border rounded-lg shadow-sm">
            {lessons.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No lessons added yet.</div>
            ) : (
              <ul className="divide-y">
                {lessons.map((lesson: any, index: number) => (
                  <li key={lesson.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div><span className="font-semibold text-slate-400 mr-3">{index + 1}</span><span className="font-medium text-slate-900">{lesson.attributes.title}</span></div>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Quiz Manager */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Assessments</h2>
            <Link href={`/instructor/courses/${course.id}/quizzes/new`} className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800">
              <Plus className="w-4 h-4" /> Add Quiz
            </Link>
          </div>

          <div className="bg-white border rounded-lg shadow-sm">
            {quizzes.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No quizzes added yet.</div>
            ) : (
              <ul className="divide-y">
                {quizzes.map((quiz: any) => (
                  <li key={quiz.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-900">{quiz.attributes.title}</span>
                    </div>
                    <button onClick={() => handleDeleteQuiz(quiz.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </ProtectedLayout>
  );
}
