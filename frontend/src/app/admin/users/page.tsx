'use client';

import React, { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import AlertModal from '@/components/ui/AlertModal';

interface PlatformUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  role: {
    id: number;
    name: string;
  };
}

interface Role {
  id: number;
  name: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string, title?: string}>({ isOpen: false, message: '' });
  const showAlert = (message: string, title = 'Notification') => setAlertConfig({ isOpen: true, message, title });
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchUsersAndRoles = async () => {
      try {
        const response = await apiClient.get('/admin-dashboard/users');
        setUsers(response.data.data.users);
        setRoles(response.data.data.roles);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsersAndRoles();
  }, []);

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    if (!confirm('Are you sure you want to change this user\'s role?')) return;
    
    setUpdatingId(userId);
    try {
      await apiClient.put(`/admin-dashboard/users/${userId}/role`, {
        data: { roleId: newRoleId }
      });

      // Optimistically update the UI without a full reload
      const selectedRole = roles.find(r => r.id === newRoleId);
      if (selectedRole) {
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId 
              ? { ...u, role: { id: selectedRole.id, name: selectedRole.name } } 
              : u
          )
        );
      }
    } catch (error: any) {
      showAlert(error.response?.data?.error?.message || 'Failed to update role', 'Error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ProtectedLayout>
      <AlertModal isOpen={alertConfig.isOpen} onClose={closeAlert} message={alertConfig.message} title={alertConfig.title} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">View and manage roles for all users on the platform.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">Loading user database...</div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900">User ID</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900">Username</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900">Email</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900">Join Date</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">#{u.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {u.username} {isSelf && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={isSelf || updatingId === u.id}
                          value={u.role?.id || ''}
                          onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                          className={`border text-sm rounded-md p-1.5 focus:ring-slate-900 focus:border-slate-900 ${
                            isSelf ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white cursor-pointer'
                          }`}
                        >
                          {!u.role && <option value="" disabled>No Role</option>}
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {updatingId === u.id && <span className="ml-3 text-xs text-blue-600 animate-pulse">Updating...</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
