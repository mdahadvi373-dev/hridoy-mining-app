// src/pages/Admin.tsx
import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { Shield, Users, DollarSign, AlertTriangle } from 'lucide-react';

interface User {
  userId: string;
  name: string;
  email: string;
  balance: number;
  totalEarned: number;
  isBlocked: boolean;
  fraudScore: number;
  deviceId: string;
  createdAt: string;
  lastLogin: string;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalStats, setTotalStats] = useState({ totalUsers: 0, totalBalance: 0, totalEarned: 0 });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const data = await apiCall('/api/admin/users');
      setUsers(data.users);

      const totalBalance = data.users.reduce((sum: number, u: User) => sum + u.balance, 0);
      const totalEarned = data.users.reduce((sum: number, u: User) => sum + u.totalEarned, 0);

      setTotalStats({
        totalUsers: data.users.length,
        totalBalance,
        totalEarned
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await apiCall(`/api/admin/user/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      fetchAllUsers();
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Shield className="text-red-600" /> Admin Control Panel
          </h1>
          <p className="text-gray-600 mt-1">Full control over all users & earnings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow">
          <Users className="w-10 h-10 text-blue-600 mb-4" />
          <p className="text-4xl font-bold">{totalStats.totalUsers}</p>
          <p className="text-gray-500">Total Users</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow">
          <DollarSign className="w-10 h-10 text-green-600 mb-4" />
          <p className="text-4xl font-bold">{totalStats.totalBalance.toFixed(2)}</p>
          <p className="text-gray-500">Total Balance (AED)</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow">
          <DollarSign className="w-10 h-10 text-emerald-600 mb-4" />
          <p className="text-4xl font-bold">{totalStats.totalEarned.toFixed(2)}</p>
          <p className="text-gray-500">Total Platform Earned</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold">All Users</h2>
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-5 py-3 rounded-2xl w-96 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-5">User</th>
              <th className="text-left p-5">Device ID</th>
              <th className="text-right p-5">Balance</th>
              <th className="text-right p-5">Total Earned</th>
              <th className="text-center p-5">Fraud</th>
              <th className="text-center p-5">Status</th>
              <th className="text-center p-5">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.userId} className="border-t hover:bg-gray-50">
                <td className="p-5">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="p-5 text-sm font-mono text-gray-600">{user.deviceId}</td>
                <td className="p-5 text-right font-bold text-green-600">{user.balance.toFixed(2)} AED</td>
                <td className="p-5 text-right text-emerald-600">{user.totalEarned.toFixed(2)} AED</td>
                <td className="p-5 text-center">
                  <span className={`inline-block px-4 py-1 rounded-full text-sm ${user.fraudScore > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.fraudScore}%
                  </span>
                </td>
                <td className="p-5 text-center">
                  {user.isBlocked ? 
                    <span className="text-red-600 font-bold">BLOCKED</span> : 
                    <span className="text-green-600 font-bold">Active</span>}
                </td>
                <td className="p-5 text-center">
                  <button
                    onClick={() => toggleBlock(user.userId, user.isBlocked)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${user.isBlocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                  >
                    {user.isBlocked ? 'Unblock' : 'Block User'}
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
