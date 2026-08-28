'use client';

import React, { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Users, BookOpen, GraduationCap, Video } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalLessons: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin-dashboard/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Total Enrollments', value: stats.totalEnrollments, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Total Lessons', value: stats.totalLessons, icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <ProtectedLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">High-level statistics for the LMS platform.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ProtectedLayout>
  );
}
