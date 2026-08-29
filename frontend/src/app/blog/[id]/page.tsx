'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import apiClient from '@/lib/axios';
import { ChevronLeft, Calendar, User, Clock, Sparkles, BookOpen, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function BlogReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await apiClient.get(`/blogs/${params.id}?populate=author`);
        setBlog(response.data.data);
      } catch (error) {
        console.error('Failed to fetch blog:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchBlog();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24 text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading publication...
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Article Not Found</h2>
          <p className="text-slate-500 text-sm max-w-md">
            This publication may have been unpublished or moved by the editorial team.
          </p>
          <Link
            href="/blog"
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to All Articles
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-6">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Engineering Blog
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Engineering Publication
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {blog.attributes?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-2 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {blog.attributes?.author?.data?.attributes?.username?.charAt(0).toUpperCase() || 'E'}
                </div>
                <span className="font-semibold text-slate-800">
                  {blog.attributes?.author?.data?.attributes?.username || 'Editorial Team'}
                </span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {blog.attributes?.publishedAt ? new Date(blog.attributes.publishedAt).toLocaleDateString() : 'Recent'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                5 min read
              </span>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-200 border border-slate-200 shadow-md">
          <Image
            src={blog.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
            alt={blog.attributes?.title || 'Article Image'}
            fill
            className="object-cover"
          />
        </div>

        {/* Article Body */}
        <article className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs prose prose-slate max-w-none text-slate-700 leading-relaxed">
          <ReactMarkdown>{blog.attributes?.content || 'No content provided.'}</ReactMarkdown>
        </article>

        {/* Bottom CTA to explore courses */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 text-center space-y-4 shadow-lg">
          <h3 className="text-xl font-bold">Want to learn this hands-on?</h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
            Take your engineering skills further with interactive, full-stack video lessons and quiz tracks.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Explore Course Curriculum
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
