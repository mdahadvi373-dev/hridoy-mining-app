import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEarnings } from '../context/EarningContext';
import { ChevronLeft, CheckCircle, Clock, DollarSign, FileText, Send } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  reward: number;
  estimatedTime: number;
  questions: number;
  completed: boolean;
  category: string;
}

const SurveysPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { completeTask } = useEarnings();
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [surveyComplete, setSurveyComplete] = useState(false);

  const surveys: Survey[] = [
    {
      id: 'survey_1',
      title: 'Product Feedback Survey',
      description: 'Help us improve our products by sharing your experience',
      reward: 1.50,
      estimatedTime: 5,
      questions: 5,
      completed: false,
      category: 'Consumer'
    },
    {
      id: 'survey_2',
      title: 'Shopping Experience Survey',
      description: 'Tell us about your online shopping habits',
      reward: 2.00,
      estimatedTime: 7,
      questions: 8,
      completed: false,
      category: 'Retail'
    },
    {
      id: 'survey_3',
      title: 'App Usability Test',
      description: 'Test our new mobile app and provide feedback',
      reward: 2.50,
      estimatedTime: 10,
      questions: 10,
      completed: false,
      category: 'Technology'
    },
    {
      id: 'survey_4',
      title: 'Travel Preferences Survey',
      description: 'Share your travel preferences and habits',
      reward: 1.75,
      estimatedTime: 6,
      questions: 6,
      completed: false,
      category: 'Travel'
    },
    {
      id: 'survey_5',
      title: 'Entertainment Habits Survey',
      description: 'Help us understand your entertainment preferences',
      reward: 1.25,
      estimatedTime: 4,
      questions: 5,
      completed: false,
      category: 'Entertainment'
    }
  ];

  const sampleQuestions = [
    'How satisfied are you with our service?',
    'Would you recommend us to a friend?',
    'What improvements would you like to see?',
    'How often do you use our platform?',
    'Rate your overall experience.'
  ];

  const sampleOptions = [
    'Very Satisfied',
    'Satisfied',
    'Neutral',
    'Dissatisfied',
    'Very Dissatisfied'
  ];

  const handleStartSurvey = (survey: Survey) => {
    setActiveSurvey(survey);
    setCurrentQuestion(0);
    setAnswers({});
    setSurveyComplete(false);
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < (activeSurvey?.questions || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setSurveyComplete(true);
    }
  };

  const handleSubmitSurvey = () => {
    if (activeSurvey) {
      completeTask(`survey_${activeSurvey.id}`);
      setActiveSurvey(null);
      setSurveyComplete(false);
    }
  };

  const closeSurvey = () => {
    setActiveSurvey(null);
    setSurveyComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white hover:text-orange-300 transition">
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Surveys
            </h1>
            <p className="text-orange-200 text-sm">Complete surveys to earn rewards!</p>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Survey List */}
        {!activeSurvey && (
          <>
            <div className="grid gap-4">
              {surveys.map((survey) => (
                <div key={survey.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-orange-400 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-orange-500/30 text-orange-200 rounded-full text-xs font-medium">
                          {survey.category}
                        </span>
                        {survey.completed && (
                          <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{survey.title}</h3>
                      <p className="text-orange-200 text-sm mb-4">{survey.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-bold text-xl">${survey.reward.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-orange-200 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{survey.estimatedTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{survey.questions} questions</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartSurvey(survey)}
                      disabled={survey.completed}
                      className={`px-6 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${survey.completed ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'}`}
                    >
                      {survey.completed ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Start Survey
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <p className="text-white font-medium">Choose a Survey</p>
                    <p className="text-orange-200 text-sm">Select from available surveys</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <p className="text-white font-medium">Answer Questions</p>
                    <p className="text-orange-200 text-sm">Complete all survey questions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <p className="text-white font-medium">Earn Rewards</p>
                    <p className="text-orange-200 text-sm">Get paid for your time!</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Active Survey */}
        {activeSurvey && !surveyComplete && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
              <div className="flex justify-between items-center text-white">
                <span className="font-semibold">{activeSurvey.title}</span>
                <span>{currentQuestion + 1} of {activeSurvey.questions}</span>
              </div>
              <div className="mt-2 bg-white/30 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${((currentQuestion + 1) / activeSurvey.questions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-8">
              <h3 className="text-xl font-semibold mb-6">
                {sampleQuestions[currentQuestion] || `Question ${currentQuestion + 1}`}
              </h3>

              <div className="space-y-3">
                {sampleOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 rounded-xl text-left transition flex items-center gap-4 ${answers[currentQuestion] === option ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion] === option ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {answers[currentQuestion] === option && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={closeSurvey}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion]}
                  className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${answers[currentQuestion] ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {currentQuestion < activeSurvey.questions - 1 ? 'Next' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Survey Complete */}
        {surveyComplete && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Survey Completed!</h2>
            <p className="text-gray-600 mb-6">Thank you for completing the survey</p>

            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <p className="text-green-600 font-semibold text-lg">You earned ${activeSurvey?.reward.toFixed(2)}!</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeSurvey}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition"
              >
                Back to Surveys
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;