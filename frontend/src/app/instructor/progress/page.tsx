'use client';

import React, { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Users } from 'lucide-react';

export default function InstructorProgressPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!user) return;
      try {
        // Deep populate to get the Student details and Course details
        // Strictly filter to ensure the Course belongs to THIS instructor
        const response = await apiClient.get(
          `/enrollments?filters[course][instructor][id][$eq]=${user.id}&populate=student,course`
        );
        setEnrollments(response.data.data);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentProgress();
  }, [user]);

  return (
    <ProtectedLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Progress</h1>
        <p className="text-slate-500 mt-1">Monitor the students enrolled in your courses.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Loading student data...</div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No students yet</h3>
          <p className="text-slate-500">You don't have any students enrolled in your courses right now.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Student Name</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Email</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Enrolled Course</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-right">Enrollment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enrollment) => {
                const student = enrollment.attributes.student?.data?.attributes;
                const course = enrollment.attributes.course?.data?.attributes;
                
                // Skip rendering if relations are broken (e.g. course deleted)
                if (!student || !course) return null;

                return (
                  <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{student.username}</td>
                    <td className="px-6 py-4 text-slate-500">{student.email}</td>
                    <td className="px-6 py-4 text-slate-900">{course.title}</td>
                    <td className="px-6 py-4 text-slate-500 text-right">
                      {new Date(enrollment.attributes.enrolledAt || enrollment.attributes.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedLayout>
  );
}
