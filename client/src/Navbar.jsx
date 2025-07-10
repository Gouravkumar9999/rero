import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from './logo.png';
import GradientText from "./components/gradientText";
import { getSocket } from './socket';
import DarkModeToggle from "./DarkModeToggle";

const Navbar = ({ user, setUser }) => {
  const [hasSlotAccess, setHasSlotAccess] = useState(false);
  const navigate = useNavigate();

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
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 dark:bg-white dark:bg-opacity-90 shadow-lg transition-colors">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
        <h2 className="text-2xl font-extrabold text-cyan-400 dark:text-cyan-700 drop-shadow-md text-center">
          <GradientText
            colors={["#2BC6D1", "#2BC6D1", "#2BC6D1", "#28007B", "#2BC6D1"]}
            animationSpeed={8}
            showBorder={false}
            className="custom-class"
          >
            IEEE Robotics and Automation Society
          </GradientText>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-cyan-200 dark:text-cyan-700 hover:text-cyan-400 dark:hover:text-cyan-900 font-semibold transition-colors">Home</Link>
        {!user && <Link to="/login" className="text-cyan-200 dark:text-cyan-700 hover:text-cyan-400 dark:hover:text-cyan-900 font-semibold transition-colors">Login</Link>}
        {!user && <Link to="/register" className="text-cyan-200 dark:text-cyan-700 hover:text-cyan-400 dark:hover:text-cyan-900 font-semibold transition-colors">Register</Link>}
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