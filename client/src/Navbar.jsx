import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './logo.png';
import GradientText from "./components/gradientText";
import { getSocket } from './socket';

const Navbar = ({ user, setUser }) => {
  const [hasSlotAccess, setHasSlotAccess] = useState(false); // ✅ Hook inside the component
  const navigate = useNavigate();

  useEffect(() => {
    const checkSlot = async () => {
      if (!user) return;
      try {
        const res = await fetch('http://localhost:8000/validate-slot-access', {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        });
        const data = await res.json();
        setHasSlotAccess(data.access);
      } catch (err) {
        console.error("Error checking slot access:", err);
        setHasSlotAccess(false);
      }
    };

    checkSlot();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.disconnect();
      console.log("[Socket] Disconnected on logout");
    }

    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-wrapper">
          <img src={logo} alt="Logo" className="navbar-logo" />
        </div>
        <h2 className="logo" style={{
          color: "#2BC6D1",
          fontSize: "3rem",
          fontWeight: "bolder",
          textShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)",
          textAlign: "center"
        }}>
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
      <div className="navbar-links">
        <Link to="/">Home</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>

            <button
              className="uploader-button"
              onClick={() => navigate('/uploader')}
              disabled={!hasSlotAccess}
              style={{
                marginLeft: '10px',
                backgroundColor: hasSlotAccess ? '#2BC6D1' : 'gray',
                border: 'none',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: hasSlotAccess ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
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
      </div>
    </nav>
  );
};

export default Navbar;
