'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { PlayCircle } from 'lucide-react';

interface Enrollment {
  id: number;
  attributes: {
    enrolledAt: string;
    course: {
      data: {
        id: number;
        attributes: {
          title: string;
          coverImageUrl: string;
          instructor: {
            data: { attributes: { username: string } }
          };
        }
      }
    }
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        // Deep populate to get course info AND the instructor's name inside it
        const response = await apiClient.get('/enrollments?populate[course][populate]=instructor');
        setEnrollments(response.data.data);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <ProtectedLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Learning Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back, {user?.username}. Continue where you left off.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-500">Loading your courses...</div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses yet</h3>
          <p className="text-slate-500 mb-6">You haven't enrolled in any courses. Browse the catalog to get started!</p>
          <Link href="/courses" className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition-colors">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.attributes.course.data;
            if (!course) return null; // Safety check in case a course was deleted

            return (
              <div key={enrollment.id} className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-40 bg-slate-200">
                  <Image
                    src={course.attributes.coverImageUrl || 'https://placehold.co/800x400?text=Course'}
                    alt={course.attributes.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mb-1">
                    {course.attributes.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    By {course.attributes.instructor?.data?.attributes?.username || 'Unknown'}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <Link 
                      href={`/student/courses/${course.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Continue Learning
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ProtectedLayout>
  );
}
