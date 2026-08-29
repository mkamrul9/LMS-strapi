'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { BookOpen, Search, ExternalLink, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface CourseItem {
  id: number;
  documentId?: string;
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
    lessons: {
      data: Array<{ id: number; attributes: { title: string } }>;
    };
  };
}

export default function ContentManagerCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get('/courses?populate=instructor,lessons');
        setCourses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) =>
    (c.attributes?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.attributes?.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Content Strategy & Library
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Course Content Library</h1>
            <p className="text-slate-500 text-sm">Review published course modules, curriculum structure, and syllabus copy.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search curriculum..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>
        </div>

        {/* Content Cards */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading curriculum database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
            <p className="text-xs text-slate-500">Try clearing search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const lessonsCount = course.attributes?.lessons?.data?.length || 0;
              return (
                <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-slate-100">
                      <Image
                        src={course.attributes?.coverImageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'}
                        alt={course.attributes?.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {course.attributes?.instructor?.data?.attributes?.username || 'Senior Instructor'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <Layers className="w-3 h-3" />
                          {lessonsCount} Modules
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                        {course.attributes?.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {course.attributes?.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                    <Link
                      href={`/courses/${course.id}`}
                      className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Inspect Live Syllabus</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
