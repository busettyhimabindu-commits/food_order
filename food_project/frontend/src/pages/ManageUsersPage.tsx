import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { Users, Shield, UserCheck } from 'lucide-react';
import { adminService } from '../services/adminService';
import { User } from '../types';
import { getPlaceholderImage } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast('Role Updated', `User role changed to ${newRole}`, 'success');
      loadUsers();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to update user role', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Super Admin User Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage system accounts & role authorizations</p>
        </div>

        {loading ? (
          <SkeletonLoader count={4} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.avatar_url || getPlaceholderImage(u.name, 'user')} alt={u.name} className="w-9 h-9 rounded-xl object-cover" />
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-500">{u.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="customer">Customer</option>
                        <option value="restaurant_admin">Restaurant Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageUsersPage;
