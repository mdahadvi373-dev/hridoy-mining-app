import { useState, useEffect } from 'react';
import { Wallet, Trophy, Gamepad2, Users, ArrowRight, Star, Zap } from 'lucide-react';

function App() {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState({ name: "", photoURL: "" });
  const [loading, setLoading] = useState(true);

  // Fetch User Data + Balance (Server Controlled)
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/user/me', {  // or your route
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setUser(data.user || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">RealEarn</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gray-900 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-green-500/30">
              <Wallet className="text-green-400" size={20} />
              <span className="font-semibold text-xl">৳ {balance.toFixed(2)}</span>
            </div>
            <img src={user.photoURL || "https://i.pravatar.cc/128"} className="w-10 h-10 rounded-full ring-2 ring-green-500" alt="" />
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-12">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-5 text-center pt-10">
          <h2 className="text-6xl md:text-7xl font-bold leading-none mb-6">
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Real AED</span><br />
            Every Single Day
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Surveys • Games • Offers — Instant payout, no minimum limit
          </p>
        </div>

        {/* Quick Actions */}
        <div className="max-w-5xl mx-auto px-5 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => window.location.href = '/surveys'} 
               className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-3xl cursor-pointer hover:scale-105 transition-all group">
            <Users className="w-12 h-12 mb-6" />
            <h3 className="text-3xl font-bold">Surveys</h3>
            <p className="mt-2 text-blue-100">Up to 30 AED per survey</p>
            <div className="mt-8 flex items-center text-sm font-medium">
              Start Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
            </div>
          </div>

          <div onClick={() => window.location.href = '/games'} 
               className="bg-gradient-to-br from-purple-600 to-violet-600 p-8 rounded-3xl cursor-pointer hover:scale-105 transition-all group">
            <Gamepad2 className="w-12 h-12 mb-6" />
            <h3 className="text-3xl font-bold">Play Games</h3>
            <p className="mt-2 text-purple-100">Install & Earn Big</p>
            <div className="mt-8 flex items-center text-sm font-medium">
              Play Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-8 rounded-3xl cursor-pointer hover:scale-105 transition-all group">
            <Trophy className="w-12 h-12 mb-6" />
            <h3 className="text-3xl font-bold">Special Offers</h3>
            <p className="mt-2 text-amber-100">High paying tasks</p>
            <div className="mt-8 flex items-center text-sm font-medium">
              See Offers <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
