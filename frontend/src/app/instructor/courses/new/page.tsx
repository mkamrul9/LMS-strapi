'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/courses', {
        data: {
          ...formData,
          publishedAt: new Date().toISOString()
        }
      });

      const newCourse = response.data.data;
      // Use documentId for navigation in Strapi V5
      const courseNav = newCourse.documentId || newCourse.id;
      toast.success('Course created successfully!');
      router.push(`/instructor/courses/${courseNav}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to create course');
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Create New Course</h1>
          <p className="text-slate-500 mt-1 text-sm">Fill in the details below to publish a new course to the catalog.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Title *</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., Advanced React Patterns"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image URL</label>
            <input 
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({...formData, coverImageUrl: e.target.value})}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Description <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
            <textarea 
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="## What you'll learn&#10;&#10;Describe what students will master..."
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl transition-colors shadow-sm shadow-blue-600/20"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
