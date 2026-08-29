'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Edit, Trash2, Globe, FileEdit, Sparkles, ExternalLink } from 'lucide-react';

export default function BlogManagerPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      const response = await apiClient.get('/blogs?publicationState=preview&sort=createdAt:desc');
      setBlogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/blogs/${id}`);
      setBlogs(blogs.filter((b) => b.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete post');
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Content Management Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Editorial Publications</h1>
            <p className="text-slate-500 text-sm">Write, draft, and publish industry articles and engineering guides.</p>
          </div>

          <Link
            href="/content-manager/blog/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </Link>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading articles...
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-xs">
            <FileEdit className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No blog posts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start writing architectural articles and share engineering knowledge with our community.
            </p>
            <Link
              href="/content-manager/blog/new"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Write First Article
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="px-6 py-4 font-bold">Article Title</th>
                    <th className="px-6 py-4 font-bold">Publication Status</th>
                    <th className="px-6 py-4 font-bold">Last Modified</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blogs.map((blog) => {
                    const isPublished = !!blog.attributes?.publishedAt;
                    return (
                      <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <Image
                                src={blog.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'}
                                alt={blog.attributes?.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">{blog.attributes?.title}</div>
                              <div className="text-xs text-slate-400 font-mono">UID: {blog.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Globe className="w-3.5 h-3.5" /> Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <FileEdit className="w-3.5 h-3.5" /> Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(blog.attributes?.updatedAt || blog.attributes?.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/content-manager/blog/${blog.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>

                          {isPublished && (
                            <Link
                              href={`/blog/${blog.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                              title="View Public Post"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
