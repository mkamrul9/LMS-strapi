'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/components/layout/Navbar';
import apiClient from '@/lib/axios';
import { ChevronLeft } from 'lucide-react';
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
        router.push('/blog');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchBlog();
  }, [params.id, router]);

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading article...</div>;
  if (!blog) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Blog
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          {blog.attributes.title}
        </h1>
        
        <div className="flex items-center gap-4 text-slate-600 mb-10 border-b pb-8">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-900 font-bold">
            {blog.attributes.author?.data?.attributes?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{blog.attributes.author?.data?.attributes?.username || 'Platform Team'}</p>
            <p className="text-sm">{new Date(blog.attributes.publishedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden mb-12">
           <Image
              src={blog.attributes.coverImageUrl || 'https://placehold.co/800x400?text=Blog'}
              alt={blog.attributes.title}
              fill
              className="object-cover"
            />
        </div>

        <div className="prose prose-slate prose-lg max-w-none mb-20">
          <ReactMarkdown>{blog.attributes.content}</ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
