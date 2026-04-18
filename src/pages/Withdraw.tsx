// src/pages/Withdraw.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Withdraw: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');

  const handleWithdraw = () => {
    if (!amount) return alert('Enter amount');
    if (Number(amount) > (user?.balance || 0)) return alert('Not enough balance');

    alert(`✅ Withdrawal request of ${amount} AED submitted!\n\n(Real payout will be processed within 24-48 hours via PayPal/Bank)`);
    // এখানে পরে real withdraw API যোগ করতে পারবা
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white rounded-3xl shadow p-10">
      <h1 className="text-3xl font-bold text-center mb-8">Withdraw Earnings</h1>
      <p className="text-center text-gray-500 mb-8">Current Balance: <span className="font-semibold text-green-600">{user?.balance.toFixed(2)} AED</span></p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount (AED)"
        className="w-full px-6 py-5 border rounded-2xl text-3xl text-center focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={handleWithdraw}
        className="w-full mt-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 rounded-3xl text-xl font-semibold hover:scale-105 transition"
      >
        Request Withdrawal
      </button>

      <p className="text-xs text-center text-gray-400 mt-8">
        Minimum withdrawal: 10 AED • Processed via PayPal / Bank Transfer
      </p>
    </div>
  );
};

export default Withdraw;
