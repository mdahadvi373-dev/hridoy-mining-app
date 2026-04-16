import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEarnings } from '../context/EarningContext';
import { Gamepad2, Play, Star, Trophy, ChevronLeft, Target, Zap, Award } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  reward: number;
  duration: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  completions: number;
}

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { completeTask } = useEarnings();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const games: Game[] = [
    {
      id: 'click_master',
      title: 'Click Master',
      description: 'Click the target as fast as you can!',
      reward: 0.50,
      duration: 30,
      difficulty: 'easy',
      icon: '🎯',
      completions: 156
    },
    {
      id: 'memory_match',
      title: 'Memory Match',
      description: 'Match the pairs to earn rewards!',
      reward: 1.00,
      duration: 60,
      difficulty: 'medium',
      icon: '🧠',
      completions: 89
    },
    {
      id: 'spin_wheel',
      title: 'Lucky Spin',
      description: 'Spin the wheel for bonus rewards!',
      reward: 0.75,
      duration: 20,
      difficulty: 'easy',
      icon: '🎰',
      completions: 234
    },
    {
      id: 'number_guess',
      title: 'Number Guess',
      description: 'Guess the number to win prizes!',
      reward: 1.50,
      duration: 45,
      difficulty: 'hard',
      icon: '🔢',
      completions: 45
    },
    {
      id: 'shape_catch',
      title: 'Shape Catcher',
      description: 'Catch falling shapes and score!',
      reward: 0.80,
      duration: 40,
      difficulty: 'medium',
      icon: '⭐',
      completions: 112
    },
    {
      id: 'balloon_pop',
      title: 'Balloon Pop',
      description: 'Pop balloons and collect coins!',
      reward: 0.60,
      duration: 35,
      difficulty: 'easy',
      icon: '🎈',
      completions: 198
    }
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameStarted) {
      endGame();
    }
  }, [gameStarted, timeLeft]);

  const startGame = (game: Game) => {
    setActiveGame(game);
    setGameStarted(true);
    setTimeLeft(game.duration);
    setScore(0);
    setGameOver(false);
  };

  const handleClick = () => {
    if (gameStarted && activeGame) {
      setScore(prev => prev + 1);
    }
  };

  const endGame = () => {
    setGameStarted(false);
    setGameOver(true);
    if (activeGame && score > 0) {
      completeTask(`game_${activeGame.id}`);
    }
  };

  const closeGame = () => {
    setActiveGame(null);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white hover:text-purple-300 transition">
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              Play & Earn
            </h1>
            <p className="text-purple-200 text-sm">Complete games to earn rewards!</p>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-purple-400 transition group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl">{game.icon}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getDifficultyColor(game.difficulty)}`}>
                  {game.difficulty}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
              <p className="text-purple-200 text-sm mb-4">{game.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">${game.reward.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">{game.completions} plays</span>
                </div>
              </div>
              <button
                onClick={() => startGame(game)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Play Now
              </button>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6">Your Gaming Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{games.reduce((sum, g) => sum + g.completions, 0)}</p>
              <p className="text-purple-300 text-sm">Total Games Played</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Zap className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">$5.80</p>
              <p className="text-purple-300 text-sm">Total Earned</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">85%</p>
              <p className="text-purple-300 text-sm">Win Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Modal */}
      {activeGame && gameStarted && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-purple-500">
            <div className="text-center mb-6">
              <span className="text-6xl">{activeGame.icon}</span>
              <h2 className="text-2xl font-bold text-white mt-4">{activeGame.title}</h2>
            </div>

            {/* Click Target Game */}
            {activeGame.id === 'click_master' && (
              <div className="relative">
                <div className="flex justify-between text-white mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-400" />
                    <span>Score: {score}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span>Time: {timeLeft}s</span>
                  </div>
                </div>
                <button
                  onClick={handleClick}
                  className="w-full h-64 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-8xl hover:scale-105 transition-transform active:scale-95"
                >
                  🎯
                </button>
              </div>
            )}

            {/* Memory Match Game */}
            {activeGame.id === 'memory_match' && (
              <div className="text-center">
                <div className="flex justify-between text-white mb-4">
                  <span>Score: {score}</span>
                  <span>Time: {timeLeft}s</span>
                </div>
                <div className="bg-white/20 rounded-xl p-6">
                  <p className="text-white text-lg mb-4">Match the pairs!</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(16)].map((_, i) => (
                      <button
                        key={i}
                        onClick={handleClick}
                        className="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center text-2xl transition"
                      >
                        ?
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lucky Spin Game */}
            {activeGame.id === 'spin_wheel' && (
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-white">Time Left: {timeLeft}s</span>
                </div>
                <button
                  onClick={handleClick}
                  className="w-full py-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-6xl hover:animate-bounce transition"
                >
                  🎰
                </button>
                <p className="text-white mt-4">Click to spin! Score: {score}</p>
              </div>
            )}

            {/* Default simple game */}
            {!['click_master', 'memory_match', 'spin_wheel'].includes(activeGame.id) && (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-purple-200">Click the button to earn points!</p>
                </div>
                <button
                  onClick={handleClick}
                  className="w-full py-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-6xl hover:scale-105 transition-transform"
                >
                  ⭐
                </button>
                <div className="mt-4 flex justify-between text-white">
                  <span>Score: {score}</span>
                  <span>Time: {timeLeft}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
            <p className="text-gray-600 mb-6">You scored {score} points in {activeGame?.duration} seconds</p>
            {score > 0 && (
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <p className="text-green-600 font-semibold">Congratulations! You earned ${activeGame?.reward.toFixed(2)}!</p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => activeGame && startGame(activeGame)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition"
              >
                Play Again
              </button>
              <button
                onClick={closeGame}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;