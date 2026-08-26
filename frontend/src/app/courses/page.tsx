'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import apiClient from '@/lib/axios';
import { Search } from 'lucide-react';

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
        }
      }
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
        // Fetch courses and populate the instructor relation
        const response = await apiClient.get('/courses?populate=instructor');
        setCourses(response.data.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.attributes.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-slate-500">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No courses found matching your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block h-full">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="relative h-48 w-full bg-slate-200">
                    <Image
                      src={course.attributes.coverImageUrl || 'https://placehold.co/800x400?text=Course'}
                      alt={course.attributes.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                      {course.attributes.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-3">
                      {course.attributes.description}
                    </p>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                      <span>By {course.attributes.instructor?.data?.attributes?.username || 'Unknown'}</span>
                      <span className="font-medium text-slate-900 group-hover:text-blue-600">View Details &rarr;</span>
                    </div>
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
