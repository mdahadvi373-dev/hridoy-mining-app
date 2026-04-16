import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, DollarSign, TrendingUp, AlertTriangle, Search, Filter, Eye, Ban, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  totalEarned: number;
  fraudScore: number;
  createdAt: Date;
  lastLogin?: Date;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user is admin (you'll need to implement admin role in Firebase)
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(query(usersRef, orderBy('createdAt', 'desc')));

      const usersData: UserData[] = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        usersData.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || 'Unknown',
          balance: data.balance || 0,
          totalEarned: data.totalEarned || 0,
          fraudScore: data.fraudScore || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate()
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        fraudScore: 100
      });
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const activateUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        fraudScore: 0
      });
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.fraudScore < 50) ||
                         (filterStatus === 'suspended' && user.fraudScore >= 50);
    return matchesSearch && matchesFilter;
  });

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  const totalEarnings = users.reduce((sum, u) => sum + u.totalEarned, 0);
  const suspiciousUsers = users.filter(u => u.fraudScore >= 50).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage users and monitor platform</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Balance</p>
                <p className="text-3xl font-bold text-green-600">${totalBalance.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-purple-600">${totalEarnings.toFixed(2)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Flagged Users</p>
                <p className="text-3xl font-bold text-red-600">{suspiciousUsers}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">{user.displayName[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">${user.balance.toFixed(2)}</td>
                    <td className="px-6 py-4">${user.totalEarned.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.fraudScore >= 50 ? 'bg-red-100 text-red-700' : user.fraudScore >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {user.fraudScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.createdAt.toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {user.fraudScore < 50 ? (
                          <button
                            onClick={() => suspendUser(user.uid)}
                            className="p-2 hover:bg-red-100 rounded-lg transition"
                            title="Suspend User"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUser(user.uid)}
                            className="p-2 hover:bg-green-100 rounded-lg transition"
                            title="Activate User"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 py-8">No users found.</p>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{selectedUser.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance:</span>
                <span className="font-medium text-green-600">${selectedUser.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Earned:</span>
                <span className="font-medium">${selectedUser.totalEarned.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Score:</span>
                <span className={`font-medium ${selectedUser.fraudScore >= 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedUser.fraudScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Joined:</span>
                <span className="font-medium">{selectedUser.createdAt.toLocaleString()}</span>
              </div>
              {selectedUser.lastLogin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="font-medium">{selectedUser.lastLogin.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              {selectedUser.fraudScore < 50 ? (
                <button
                  onClick={() => { suspendUser(selectedUser.uid); setSelectedUser(null); }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Suspend User
                </button>
              ) : (
                <button
                  onClick={() => { activateUser(selectedUser.uid); setSelectedUser(null); }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Activate User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;