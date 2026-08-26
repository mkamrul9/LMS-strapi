'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/components/layout/Navbar';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { PlayCircle, Lock } from 'lucide-react';

interface CourseDetails {
  id: number;
  attributes: {
    title: string;
    description: string;
    coverImageUrl: string;
    instructor: {
      data: { attributes: { username: string } }
    };
    lessons: {
      data: Array<{
        id: number;
        attributes: { title: string; order: number }
      }>
    };
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Fetch course, instructor, and deeply populate lessons sorted by order
        const response = await apiClient.get(
          `/courses/${params.id}?populate=instructor,lessons&sort[lessons][order]=asc`
        );
        setCourse(response.data.data);
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchCourse();
  }, [params.id]);

  const handleEnrollClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // We will implement the actual enrollment POST request in Phase 18
    alert('Enrollment logic will be implemented in Phase 18');
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  if (!course) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Course not found.</div>;

  const lessons = course.attributes.lessons?.data || [];
  const sortedLessons = lessons.sort((a, b) => a.attributes.order - b.attributes.order);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">{course.attributes.title}</h1>
            <p className="text-lg text-slate-300">
              Instructor: {course.attributes.instructor?.data?.attributes?.username || 'Unknown'}
            </p>
            <div className="pt-4">
              <button 
                onClick={handleEnrollClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold text-lg transition-colors"
              >
                {user ? 'Enroll Now' : 'Log in to Enroll'}
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-video relative rounded-lg overflow-hidden border-4 border-slate-800 shadow-xl">
             <Image
                src={course.attributes.coverImageUrl || 'https://placehold.co/800x400?text=Course'}
                alt={course.attributes.title}
                fill
                className="object-cover"
              />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">About This Course</h2>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{course.attributes.description || 'No description provided.'}</ReactMarkdown>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Curriculum</h3>
            <p className="text-sm text-slate-500 mb-4">{sortedLessons.length} lessons</p>
            
            <ul className="space-y-3">
              {sortedLessons.map((lesson, index) => (
                <li key={lesson.id} className="flex items-start gap-3 p-3 rounded-md bg-slate-50 border border-slate-100">
                  <div className="mt-0.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {index + 1}. {lesson.attributes.title}
                    </p>
                  </div>
                </li>
              ))}
              {sortedLessons.length === 0 && (
                 <li className="text-sm text-slate-500 italic">No lessons added yet.</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
