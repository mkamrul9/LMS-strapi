'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import apiClient from '@/lib/axios';
import { Search, Sparkles, BookOpen, Users, Star, ArrowRight } from 'lucide-react';

interface Course {
  id: number;
  attributes: {
    title: string;
    description: string;
    coverImageUrl: string;
    instructor: {
      data: {
        attributes: {
          username: string;
        };
      };
    };
  };
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses?populate=instructor');
        setCourses(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    (course.attributes?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (course.attributes?.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Engineering Curriculum
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Course Catalog</h1>
            <p className="text-slate-500 text-sm">Choose from {courses.length} production-grade masterclasses.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by topic or framework..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="text-center py-24 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading engineering courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No courses match your filter</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or clear the filter to see all active courses.
            </p>
            <button
              onClick={() => setSearch('')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block h-full">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 h-full flex flex-col">
                  
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <Image
                      src={course.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
                      alt={course.attributes?.title || 'Course'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {course.attributes?.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {course.attributes?.description}
                    </p>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium truncate max-w-[150px]">
                        By <span className="text-slate-800 font-semibold">{course.attributes?.instructor?.data?.attributes?.username || 'Senior Instructor'}</span>
                      </span>
                      <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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
