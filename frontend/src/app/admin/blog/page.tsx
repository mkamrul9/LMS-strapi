'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { FileText, Search, ExternalLink, ShieldCheck, Calendar, User } from 'lucide-react';

interface AdminBlogItem {
  id: number;
  documentId?: string;
  attributes: {
    title: string;
    content: string;
    coverImageUrl: string;
    publishedAt: string | null;
    createdAt: string;
    author: {
      data: {
        attributes: {
          username: string;
        };
      };
    };
  };
}

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<AdminBlogItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllBlogs = async () => {
      try {
        const response = await apiClient.get('/blogs?status=draft&populate=author&sort=createdAt:desc');
        setBlogs(response.data.data || []);
      } catch (err) {
        console.error('Failed to load admin blogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllBlogs();
  }, []);

  const filtered = blogs.filter((b) =>
    (b.attributes?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.attributes?.author?.data?.attributes?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Editorial Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Editorial & Blog Moderation</h1>
            <p className="text-slate-500 text-sm">Review, inspect, and moderate all platform publications.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading platform publications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No blog posts found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="px-6 py-4 font-bold">Article Title</th>
                    <th className="px-6 py-4 font-bold">Author</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Publish Date</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((blog) => {
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
                        <td className="px-6 py-4 text-slate-600">
                          <span className="font-medium text-slate-900">
                            {blog.attributes?.author?.data?.attributes?.username || 'Content Team'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {blog.attributes?.publishedAt ? new Date(blog.attributes.publishedAt).toLocaleDateString() : 'Unpublished'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/blog/${blog.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition-colors"
                          >
                            <span>Read</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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
