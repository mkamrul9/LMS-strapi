'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Edit, Trash2, Globe, FileEdit } from 'lucide-react';

export default function BlogManagerPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      // ?publicationState=preview pulls BOTH drafts and published posts
      const response = await apiClient.get('/blogs?publicationState=preview&sort=createdAt:desc');
      setBlogs(response.data.data);
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
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiClient.delete(`/blogs/${id}`);
      setBlogs(blogs.filter(b => b.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete post');
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Blog Manager</h1>
          <p className="text-slate-500 mt-1">Write, draft, and publish articles.</p>
        </div>
        <Link href="/content-manager/blog/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">Loading blog database...</div>
      ) : blogs.length === 0 ? (
        <div className="bg-white border border-dashed rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No blog posts found.</p>
          <Link href="/content-manager/blog/new" className="text-blue-600 hover:underline font-medium">Start writing</Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Title</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Date Modified</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blogs.map((blog) => {
                const isPublished = !!blog.attributes.publishedAt;
                return (
                  <tr key={blog.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">{blog.attributes.title}</td>
                    <td className="px-6 py-4">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Globe className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <FileEdit className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(blog.attributes.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      {/* Note: Edit form logic omitted for brevity, but you'd route to /blog/[id]/edit */}
                      <button onClick={() => alert('Edit form uses the same logic as the create form!')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedLayout>
  );
}
