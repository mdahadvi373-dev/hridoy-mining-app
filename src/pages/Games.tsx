// src/pages/Games.tsx
import React from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, Play } from 'lucide-react';

const gameOffers = [
  { id: "g1", title: "Solitaire Grand Harvest", payout: 28, site: "Ayet Studios" },
  { id: "g2", title: "Township - Level 30", payout: 45, site: "Torox" },
  { id: "g3", title: "Fishdom - Reach Level 25", payout: 35, site: "AdGate" },
  { id: "g4", title: "Mistplay Daily Bonus", payout: 15, site: "Mistplay" },
  { id: "g5", title: "Coin Master - Village 8", payout: 52, site: "Ayet Studios" },
];

const Games: React.FC = () => {
  const { user } = useAuth();

  const completeOffer = async (offer: any) => {
    try {
      await apiCall('/api/add-earning', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.userId,
          taskId: offer.id,
          amount: offer.payout,     // full amount পাঠাবো
          site: offer.site
        })
      });
      alert(`🎉 You earned ${offer.payout} AED! (70% = ${(offer.payout * 0.7).toFixed(2)} AED added to balance)`);
      window.location.reload();
    } catch (err) {
      alert('Error completing offer');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Gamepad2 /> Games & Install Offers
      </h1>
      <p className="text-gray-600 mb-8">Highest paying game offers in 2026 • Install & reach level = instant cash</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameOffers.map(offer => (
          <div key={offer.id} className="bg-white rounded-3xl shadow hover:shadow-xl transition p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-xl">{offer.title}</h3>
                <p className="text-green-600 text-sm mt-1">{offer.site}</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-emerald-600">+{offer.payout}</span>
                <p className="text-xs text-gray-500">AED</p>
              </div>
            </div>
            <button
              onClick={() => completeOffer(offer)}
              className="mt-8 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition"
            >
              <Play size={20} /> Install & Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
