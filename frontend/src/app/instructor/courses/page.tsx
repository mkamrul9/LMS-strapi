'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user) return;
      try {
        // Explicitly filter for courses owned by this instructor
        const response = await apiClient.get(
          `/courses?filters[instructor][id][$eq]=${user.id}&populate=lessons`
        );
        setCourses(response.data.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete course');
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1">Manage your course library and curriculum.</p>
        </div>
        <Link 
          href="/instructor/courses/new" 
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Course
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No courses found</h3>
          <p className="text-slate-500 mb-4">You haven't created any courses yet.</p>
          <Link href="/instructor/courses/new" className="text-blue-600 hover:underline">
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Course Title</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Lessons</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{course.attributes.title}</td>
                  <td className="px-6 py-4 text-slate-500">{course.attributes.lessons?.data?.length || 0}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link 
                      href={`/instructor/courses/${course.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" /> Manage
                    </Link>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedLayout>
  );
}
