import React, { useEffect, useState } from 'react';
import { Link, useNavigate,useLocation } from 'react-router-dom';
import logo from './logo.png';
import { getSocket } from './socket';
import DarkModeToggle from "./DarkModeToggle";
import { Menu } from 'lucide-react';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {
  const [hasSlotAccess, setHasSlotAccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const checkSlot = async () => {
      if (!user) return;
      try {
        const res = await fetch('http://localhost:8000/validate-slot-access', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        setHasSlotAccess(data.access);
      } catch (err) {
        setHasSlotAccess(false);
      }
    };
    checkSlot();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    const socket = getSocket();
    if (socket && socket.connected) socket.disconnect();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-4 py-5 bg-white dark:bg-gray-950 dark:bg-opacity-90 shadow-lg transition-colors relative z-50">
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle Button */}
        {isHomePage && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-200 dark:bg-gray-800 rounded-md text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          title="Toggle Sidebar"
        >
          <Menu className="h-6 w-6 sm:h-5 sm:w-5" />
        </button>
           )}

        <img src={logo} alt="Logo" className="h-14 object-contain" />
      </div>

      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-900 dark:text-gray-100 hover:text-cyan-400 dark:hover:text-cyan-400 font-semibold transition-colors">Home</Link>
        {!user && <Link to="/login" className="text-gray-900 dark:text-gray-100 hover:text-cyan-400 dark:hover:text-cyan-400 font-semibold transition-colors">Login</Link>}
        {!user && <Link to="/register" className="text-gray-900 dark:text-gray-100 hover:text-cyan-400 dark:hover:text-cyan-400 font-semibold transition-colors">Register</Link>}
        {user && (
          <>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition"
            >
              Logout
            </button>
            <button
              className={`ml-2 px-4 py-2 rounded bg-cyan-500 text-white font-bold transition shadow ${
                hasSlotAccess ? "hover:bg-cyan-600 cursor-pointer" : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={() => navigate('/uploader')}
              disabled={!hasSlotAccess}
              title={
                hasSlotAccess
                  ? 'Access Arduino Uploader'
                  : '⛔ Access only during your booked time slot'
              }
            >
              Arduino Uploader
            </button>
          </>
        )}
        <DarkModeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
