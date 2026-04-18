// src/pages/Admin.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface User {
  userId: string;
  name: string;
  email: string;
  balance: number;
  totalEarned: number;
  isBlocked: boolean;
  fraudScore: number;
  createdAt: string;
  lastLogin: string;
  deviceId: string;
}

const Admin: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId: string, action: 'block' | 'unblock') => {
    try {
      await fetch(`/api/admin/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Something went wrong');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Panel - User Management</h1>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded-lg w-80"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-right">Balance (AED)</th>
              <th className="p-4 text-right">Total Earned</th>
              <th className="p-4 text-center">Fraud Score</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.userId} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{user.name}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4 text-right font-semibold">{user.balance.toFixed(2)}</td>
                <td className="p-4 text-right text-green-600">{user.totalEarned.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${user.fraudScore > 60 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.fraudScore}%
                  </span>
                </td>
                <td className="p-4 text-center">
                  {user.isBlocked ? 
                    <span className="text-red-600 font-medium">Blocked</span> : 
                    <span className="text-green-600 font-medium">Active</span>}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggleBlock(user.userId, user.isBlocked ? 'unblock' : 'block')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium ${user.isBlocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                  >
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
