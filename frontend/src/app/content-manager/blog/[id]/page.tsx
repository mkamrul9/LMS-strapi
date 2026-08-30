'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { ArrowLeft, Save, Globe, FileEdit, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState({ title: '', coverImageUrl: '', content: '' });
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await apiClient.get(`/blogs/${params.id}`);
        const blogData = res.data.data;
        if (blogData) {
          setFormData({
            title: blogData.title || blogData.attributes?.title || '',
            coverImageUrl: blogData.coverImageUrl || blogData.attributes?.coverImageUrl || '',
            content: blogData.content || blogData.attributes?.content || '',
          });
          setIsPublished(!!(blogData.publishedAt || blogData.attributes?.publishedAt));
        }
      } catch (error) {
        console.error('Failed to load blog post:', error);
        toast.error('Could not find requested article.');
        router.push('/content-manager/blog');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchBlog();
  }, [params.id, router]);

  const handleSave = async (publishStatus: boolean) => {
    setIsSubmitting(true);
    const publishedAt = publishStatus ? new Date().toISOString() : null;

    try {
      await apiClient.put(`/blogs/${params.id}`, {
        data: {
          ...formData,
          publishedAt,
        },
      });
      setIsPublished(publishStatus);
      setSavedSuccess(true);
      toast.success(publishStatus ? 'Article published!' : 'Saved as draft!');
      setTimeout(() => {
        setSavedSuccess(false);
        router.push('/content-manager/blog');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to update article');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-20 text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading article editor...
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/content-manager/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog Manager</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
              isPublished 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isPublished ? <Globe className="w-3.5 h-3.5" /> : <FileEdit className="w-3.5 h-3.5" />}
              <span>{isPublished ? 'Published' : 'Draft Mode'}</span>
            </span>
          </div>
        </div>

        {/* Editor Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs p-6 sm:p-10 space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Publication</h1>
            <p className="text-slate-500 text-xs mt-1">Make edits and toggle live release status.</p>
          </div>

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Article updated successfully! Redirecting...</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Article Title *</label>
              <input 
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base font-bold text-slate-900"
                placeholder="Article title..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Cover Image URL</label>
              <input 
                type="url"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs text-slate-700"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Markdown Content *</label>
              <textarea 
                required
                rows={14}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full border border-slate-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs text-slate-900 leading-relaxed resize-none"
                placeholder="# Introduction..."
              />
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.push('/content-manager/blog')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => handleSave(false)} 
              disabled={isSubmitting || !formData.title || !formData.content}
              className="px-5 py-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleSave(true)} 
              disabled={isSubmitting || !formData.title || !formData.content}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isPublished ? 'Update & Keep Published' : 'Publish to Live Blog'}</span>
            </button>
          </div>

        </div>
      </div>
    </ProtectedLayout>
  );
}
