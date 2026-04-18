// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Gamepad2, ClipboardList, Wallet, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">R</div>
          <h1 className="text-2xl font-bold text-gray-800">RealEarn</h1>
        </div>

        <div className="flex items-center gap-8 text-sm font-medium">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-green-600 transition">
            <Home size={18} /> Dashboard
          </Link>
          <Link to="/games" className="flex items-center gap-2 hover:text-green-600 transition">
            <Gamepad2 size={18} /> Games
          </Link>
          <Link to="/surveys" className="flex items-center gap-2 hover:text-green-600 transition">
            <ClipboardList size={18} /> Surveys
          </Link>
          <Link to="/withdraw" className="flex items-center gap-2 hover:text-green-600 transition">
            <Wallet size={18} /> Withdraw
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-green-600 font-medium">{user?.balance.toFixed(2)} AED</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
