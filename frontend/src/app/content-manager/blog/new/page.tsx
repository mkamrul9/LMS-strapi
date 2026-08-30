'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import AlertModal from '@/components/ui/AlertModal';

export default function CreateBlogPost() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', coverImageUrl: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string, title?: string}>({ isOpen: false, message: '' });

  const showAlert = (message: string, title = 'Notification') => setAlertConfig({ isOpen: true, message, title });
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  const handleSave = async (publishNow: boolean) => {
    setIsSubmitting(true);
    
    // Determine the publishedAt timestamp. Null means draft.
    const publishedAt = publishNow ? new Date().toISOString() : null;

    try {
      const response = await apiClient.post('/blogs', {
        data: {
          ...formData,
          publishedAt
        }
      });
      router.push(`/content-manager/blog/${response.data.data.id}`);
    } catch (error: any) {
      console.error(error);
      showAlert(error.response?.data?.error?.message || 'Failed to save post', 'Error');
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <AlertModal isOpen={alertConfig.isOpen} onClose={closeAlert} message={alertConfig.message} title={alertConfig.title} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Write New Post</h1>
        
        <div className="bg-white border rounded-xl shadow-sm p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Post Title *</label>
            <input 
              required type="text" value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border p-2.5 rounded-md focus:ring-slate-900 text-lg font-medium"
              placeholder="Enter a catchy title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
            <input 
              type="url" value={formData.coverImageUrl} 
              onChange={(e) => setFormData({...formData, coverImageUrl: e.target.value})}
              className="w-full border p-2.5 rounded-md focus:ring-slate-900"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content (Markdown Supported) *</label>
            <textarea 
              required rows={15} value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full border p-4 rounded-md focus:ring-slate-900 font-mono text-sm leading-relaxed"
              placeholder="# Heading 1\n\nWrite your content here..."
            />
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <button 
              type="button" onClick={() => router.back()}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium"
            >
              Cancel
            </button>
            <button 
              type="button" onClick={() => handleSave(false)} disabled={isSubmitting || !formData.title || !formData.content}
              className="px-6 py-2 text-slate-700 border hover:bg-slate-50 disabled:opacity-50 rounded-md font-medium"
            >
              Save as Draft
            </button>
            <button 
              type="button" onClick={() => handleSave(true)} disabled={isSubmitting || !formData.title || !formData.content}
              className="px-6 py-2 text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md font-bold"
            >
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
