import { useState, useEffect } from 'react';
import { Wallet, Calendar, LogOut, Shield } from 'lucide-react';

function Profile() {
  const [user, setUser] = useState<any>({});
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/user/${user.userId || 'me'}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
          setTotalEarned(data.totalEarned);
        }
      } catch (e) {}
    };

    loadProfile();
  }, []);

  const handleWithdraw = async () => {
    const amount = prompt("Enter withdraw amount (min 50 AED):");
    if (!amount) return;

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), method: "Bank", account: "Your Account" })
      });
      const data = await res.json();
      alert(data.message || "Request submitted");
    } catch (err) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-4xl mx-auto px-5 pt-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <img src={user.photoURL || "https://i.pravatar.cc/150"} className="w-28 h-28 rounded-full ring-4 ring-green-500 mb-4" />
          <h2 className="text-3xl font-bold">{user.name || "User"}</h2>
          <p className="text-green-400 mt-1">Member since 2026</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 mb-8 text-center">
          <p className="text-green-100 text-lg">Available Balance</p>
          <p className="text-6xl font-bold mt-3">৳ {balance.toFixed(2)}</p>
          <p className="text-green-100 mt-1">Total Earned: ৳ {totalEarned.toFixed(2)}</p>
        </div>

        {/* Withdraw Button */}
        <button 
          onClick={handleWithdraw}
          className="w-full bg-white text-black font-semibold py-4 rounded-2xl text-lg mb-10 hover:bg-gray-200 transition"
        >
          Withdraw Money
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-900 p-6 rounded-3xl">
            <p className="text-gray-400">Tasks Completed</p>
            <p className="text-4xl font-bold mt-2">47</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-3xl">
            <p className="text-gray-400">Current Streak</p>
            <p className="text-4xl font-bold mt-2 text-orange-400">12 days 🔥</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
            <Calendar /> Recent Activity
          </h3>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              // map transactions
              transactions.map((tx: any) => (
                <div key={tx._id} className="bg-gray-900 p-4 rounded-2xl flex justify-between">
                  <div>
                    <p>{tx.details}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className={tx.type === 'earning' ? 'text-green-400' : 'text-red-400'}>
                    {tx.type === 'earning' ? '+' : ''}৳ {Math.abs(tx.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-10">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
