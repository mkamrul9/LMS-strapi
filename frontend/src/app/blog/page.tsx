'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import apiClient from '@/lib/axios';

export default function PublicBlogList() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Standard GET natively excludes drafts in Strapi
        const response = await apiClient.get('/blogs?populate=author&sort=publishedAt:desc');
        setBlogs(response.data.data);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">LMS Platform Blog</h1>
          <p className="text-lg text-slate-600">Insights, updates, and learning resources.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-slate-500">Loading articles...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No published articles yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.id}`} className="group block">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-56 bg-slate-200">
                    <Image
                      src={blog.attributes.coverImageUrl || 'https://placehold.co/800x400?text=Blog+Post'}
                      alt={blog.attributes.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-500 mb-2">
                      {new Date(blog.attributes.publishedAt).toLocaleDateString()} • By {blog.attributes.author?.data?.attributes?.username || 'Team'}
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.attributes.title}
                    </h2>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
