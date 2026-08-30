'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, BookOpen, Sparkles, Layers, ExternalLink } from 'lucide-react';
import AlertModal from '@/components/ui/AlertModal';

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string, title?: string}>({ isOpen: false, message: '' });
  const showAlert = (message: string, title = 'Notification') => setAlertConfig({ isOpen: true, message, title });
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user) return;
      try {
        const response = await apiClient.get(
          `/courses?filters[instructor][id][$eq]=${user.id}&populate=lessons,quizzes`
        );
        setCourses(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch instructor courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course? All associated lessons and quizzes will be removed.')) return;
    try {
      await apiClient.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      showAlert(error.response?.data?.error?.message || 'Failed to delete course', 'Error');
    }
  };

  return (
    <ProtectedLayout>
      <AlertModal isOpen={alertConfig.isOpen} onClose={closeAlert} message={alertConfig.message} title={alertConfig.title} />
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Instructor Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Authored Courses</h1>
            <p className="text-slate-500 text-sm">Create, publish, and maintain curriculum modules and quizzes.</p>
          </div>

          <Link 
            href="/instructor/courses/new" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </Link>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading instructor catalog...
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No authored courses found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't published any masterclasses yet. Start building your curriculum today!
            </p>
            <Link
              href="/instructor/courses/new"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Build Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const lessonsCount = course.attributes?.lessons?.data?.length || 0;
              const quizzesCount = course.attributes?.quizzes?.data?.length || 0;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <Image
                        src={course.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                        alt={course.attributes?.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          <Layers className="w-3 h-3" />
                          {lessonsCount} Lessons
                        </span>
                        {quizzesCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            {quizzesCount} Quiz
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                        {course.attributes?.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {course.attributes?.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center gap-2">
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Manage Modules</span>
                    </Link>

                    <Link
                      href={`/courses/${course.id}`}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      title="View Live Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
