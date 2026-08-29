'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import apiClient from '@/lib/axios';
import { Newspaper, Calendar, User, ArrowRight, Sparkles } from 'lucide-react';

export default function PublicBlogList() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await apiClient.get('/blogs?populate=author&sort=publishedAt:desc');
        setBlogs(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Blog Header Card */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Engineering Insights & Updates
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">The LMSPrime Blog</h1>
          <p className="text-slate-600 text-base">
            Deep architectural teardowns, framework comparisons, and career engineering advice.
          </p>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="text-center py-24 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading articles...
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Newspaper className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No published articles yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Our editorial team is drafting new curriculum breakdowns. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.id}`} className="group block h-full">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 h-full flex flex-col">
                  
                  <div className="relative h-52 bg-slate-100 overflow-hidden">
                    <Image
                      src={blog.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                      alt={blog.attributes?.title || 'Blog Post'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{blog.attributes?.publishedAt ? new Date(blog.attributes.publishedAt).toLocaleDateString() : 'Recent'}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{blog.attributes?.author?.data?.attributes?.username || 'Editorial Team'}</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.attributes?.title}
                    </h2>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {blog.attributes?.content}
                    </p>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                      <span>Read Full Article</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
