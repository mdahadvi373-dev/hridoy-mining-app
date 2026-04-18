// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { TrendingUp, Gift, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: 0, totalEarned: 0 });

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const data = await apiCall(`/api/user/${user?.userId}`);
        setStats({ balance: data.balance, totalEarned: data.totalEarned });
      } catch (e) {}
    };
    if (user) loadBalance();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-600 mb-8">Earn real money with surveys & games • 70% to you, 30% platform fee</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-5xl font-bold text-green-600 mt-2">{stats.balance.toFixed(2)} <span className="text-2xl">AED</span></p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-5xl font-bold text-emerald-600 mt-2">{stats.totalEarned.toFixed(2)} <span className="text-2xl">AED</span></p>
              </div>
              <TrendingUp className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-3xl shadow p-8 flex flex-col justify-between">
            <div>
              <p className="text-sm opacity-80">Today’s Opportunity</p>
              <p className="text-2xl font-semibold mt-2">Complete 3 surveys & earn up to 45 AED</p>
            </div>
            <button
              onClick={() => window.location.href = '/surveys'}
              className="mt-8 bg-white text-green-700 font-semibold py-4 px-8 rounded-2xl hover:scale-105 transition"
            >
              Start Earning Now →
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          Each device = Only 1 account • Anti-fraud system active
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
