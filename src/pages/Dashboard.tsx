import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEarnings } from '../context/EarningContext';
import { Wallet, TrendingUp, Gift, Users, Gamepad2, FileText, Settings, LogOut, ChevronRight, DollarSign, Eye, Mouse } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { stats, history, availableTasks, completeTask } = useEarnings();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history' | 'withdraw'>('overview');
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const watchAd = () => {
    setShowAdPopup(true);
    // Simulate ad watching
    setTimeout(() => {
      setAdsWatched(prev => prev + 1);
      setShowAdPopup(false);
      completeTask('daily_ad_1');
    }, 5000);
  };

  const quickEarnOptions = [
    { icon: Eye, label: 'Watch Ads', color: 'bg-blue-500', reward: '$0.10', action: watchAd },
    { icon: Gamepad2, label: 'Play Games', color: 'bg-purple-500', reward: '$1.50', action: () => navigate('/games') },
    { icon: FileText, label: 'Surveys', color: 'bg-orange-500', reward: '$2.00', action: () => navigate('/surveys') },
    { icon: Gift, label: 'Daily Bonus', color: 'bg-yellow-500', reward: '$0.25', action: () => completeTask('daily_bonus') },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {currentUser?.displayName || 'User'}!</h1>
            <p className="text-green-100 text-sm">Your earning dashboard</p>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Current Balance</p>
                <p className="text-3xl font-bold text-green-600">${stats.balance.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Earned</p>
                <p className="text-3xl font-bold text-blue-600">${stats.totalEarned.toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ads Watched Today</p>
                <p className="text-3xl font-bold text-purple-600">{adsWatched}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'overview' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'tasks' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'history' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'withdraw' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Withdraw
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Quick Earn</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickEarnOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={option.action}
                      className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition group"
                    >
                      <div className={`${option.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <option.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-gray-800">{option.label}</p>
                      <p className="text-sm text-green-600">{option.reward}</p>
                    </button>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'ad' ? 'bg-blue-100' : item.type === 'game' ? 'bg-purple-100' : item.type === 'survey' ? 'bg-orange-100' : 'bg-green-100'}`}>
                            {item.type === 'ad' && <Eye className="w-5 h-5 text-blue-600" />}
                            {item.type === 'game' && <Gamepad2 className="w-5 h-5 text-purple-600" />}
                            {item.type === 'survey' && <FileText className="w-5 h-5 text-orange-600" />}
                            {item.type === 'bonus' && <Gift className="w-5 h-5 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-500">{item.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">+${item.amount.toFixed(2)}</p>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No activity yet. Start earning now!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Available Tasks</h3>
                <div className="space-y-4">
                  {availableTasks.map((task) => (
                    <div key={task.id} className="border rounded-xl p-4 hover:border-green-500 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          ${task.reward.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(task.completedActions / task.requiredActions) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{task.completedActions}/{task.requiredActions} completed</p>
                        </div>
                        <button
                          onClick={() => completeTask(task.id)}
                          disabled={task.status === 'completed'}
                          className={`px-4 py-2 rounded-lg font-medium transition ${task.status === 'completed' ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                          {task.status === 'completed' ? 'Completed' : 'Start'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Earning History</h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100' : item.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                          <DollarSign className={`w-5 h-5 ${item.status === 'completed' ? 'text-green-600' : item.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-500">{item.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+${item.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No earning history yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
                <div className="bg-green-50 rounded-xl p-6 mb-6">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-4xl font-bold text-green-600">${stats.balance.toFixed(2)}</p>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
                    <input type="number" min="5" step="0.01" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Minimum $5.00" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Details</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Enter your account number" />
                  </div>

                  <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition">
                    Withdraw Funds
                  </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-4">
                  Withdrawal requests are processed within 24-48 hours.
                  <br />Minimum withdrawal: $5.00
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ad Popup Modal */}
      {showAdPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-center">Watch Advertisement</h3>
            <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center mb-4">
              <p className="text-gray-500">Ad Content</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Please wait while the ad plays...</span>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse w-1/3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;