// src/pages/Surveys.tsx
import React from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';

const surveyOffers = [
  { id: "s1", title: "Freecash Quick Survey", payout: 18, site: "Freecash" },
  { id: "s2", title: "Swagbucks Daily Poll", payout: 12, site: "Swagbucks" },
  { id: "s3", title: "InboxDollars 10-min Survey", payout: 25, site: "InboxDollars" },
  { id: "s4", title: "PrizeRebel High Paying Survey", payout: 32, site: "PrizeRebel" },
  { id: "s5", title: "Survey Junkie Profile Match", payout: 15, site: "Survey Junkie" },
];

const Surveys: React.FC = () => {
  const { user } = useAuth();

  const completeSurvey = async (offer: any) => {
    try {
      await apiCall('/api/add-earning', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.userId,
          taskId: offer.id,
          amount: offer.payout,
          site: offer.site
        })
      });
      alert(`🎉 Survey completed! You earned ${offer.payout} AED`);
      window.location.reload();
    } catch (err) {
      alert('Error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <ClipboardList /> Surveys
      </h1>
      <p className="text-gray-600 mb-8">Best paying survey platforms 2026 • Highest payout offers</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveyOffers.map(offer => (
          <div key={offer.id} className="bg-white rounded-3xl shadow p-6 hover:shadow-xl transition">
            <h3 className="font-semibold text-xl">{offer.title}</h3>
            <p className="text-green-600 text-sm">{offer.site}</p>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <span className="text-5xl font-bold text-green-600">+{offer.payout}</span>
                <span className="text-sm text-gray-500 ml-2">AED</span>
              </div>
              <button
                onClick={() => completeSurvey(offer)}
                className="bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-green-700 transition"
              >
                Take Survey
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Surveys;
