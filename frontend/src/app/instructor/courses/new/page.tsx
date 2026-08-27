'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';

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
      // Backend automatically assigns the instructor based on the auth token (Phase 06)
      const response = await apiClient.post('/courses', {
        data: formData
      });
      // Redirect to the manager page for this new course to add lessons
      router.push(`/instructor/courses/${response.data.data.id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error?.message || 'Failed to create course');
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Create New Course</h1>
        
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-sm p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border-slate-300 rounded-md shadow-sm border p-2.5 focus:ring-slate-900 focus:border-slate-900"
              placeholder="e.g., Advanced React Patterns"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
            <input 
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({...formData, coverImageUrl: e.target.value})}
              className="w-full border-slate-300 rounded-md shadow-sm border p-2.5 focus:ring-slate-900 focus:border-slate-900"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Description (Markdown Supported)</label>
            <textarea 
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border-slate-300 rounded-md shadow-sm border p-2.5 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
