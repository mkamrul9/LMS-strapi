'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Trash2 } from 'lucide-react';

export default function CourseManagerPage() {
  const params = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Lesson Form State
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '' });
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  const fetchCourse = async () => {
    try {
      const response = await apiClient.get(`/courses/${params.id}?populate=lessons&sort[lessons][order]=asc`);
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
    
    // Auto-calculate order based on existing lessons
    const currentLessons = course?.attributes?.lessons?.data || [];
    const nextOrder = currentLessons.length > 0 
      ? Math.max(...currentLessons.map((l: any) => l.attributes.order)) + 1 
      : 1;

    try {
      await apiClient.post('/lessons', {
        data: {
          ...lessonForm,
          order: nextOrder,
          course: params.id // Link the lesson to this course (Backend verifies ownership)
        }
      });
      setLessonForm({ title: '', videoUrl: '', content: '' });
      setIsAddingLesson(false);
      await fetchCourse(); // Refresh the list
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to create lesson');
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await apiClient.delete(`/lessons/${lessonId}`);
      await fetchCourse();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete lesson');
    }
  };

  if (isLoading) return <ProtectedLayout><div className="py-20 text-center">Loading...</div></ProtectedLayout>;
  if (!course) return null;

  const lessons = course.attributes.lessons?.data || [];

  return (
    <ProtectedLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Course: {course.attributes.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lesson List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Curriculum</h2>
            {!isAddingLesson && (
              <button 
                onClick={() => setIsAddingLesson(true)}
                className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            )}
          </div>

          {/* New Lesson Inline Form */}
          {isAddingLesson && (
            <form onSubmit={handleCreateLesson} className="bg-white border rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">New Lesson</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Title *</label>
                  <input required type="text" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full border p-2 rounded focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Optional)</label>
                  <input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="w-full border p-2 rounded focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Text Content (Markdown)</label>
                  <textarea rows={4} value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} className="w-full border p-2 rounded focus:ring-slate-900" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingLesson(false)} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded">Cancel</button>
                  <button type="submit" disabled={isSubmittingLesson} className="px-3 py-1.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-50">Save Lesson</button>
                </div>
              </div>
            </form>
          )}

          {/* Lesson List */}
          <div className="bg-white border rounded-lg shadow-sm">
            {lessons.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No lessons added yet.</div>
            ) : (
              <ul className="divide-y">
                {lessons.map((lesson: any, index: number) => (
                  <li key={lesson.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-400 mr-3">{index + 1}</span>
                      <span className="font-medium text-slate-900">{lesson.attributes.title}</span>
                    </div>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
