import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import TimeSlot from './TimeSlot';
import UploaderPage from './UploaderPage.js'
import Particles from "./components/particles";
import RobotShowcase from './RobotShowcase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 , pointerEvents: "auto" }}>
        <Particles 
          particleCount={900}
          particleSpread={2}
          speed={0.1}
          particleColors={["#2BC6D1", "#28007B", "#FFFFFF"]}
          moveParticlesOnHover={true}
          particleHoverFactor={1.2}
          alphaParticles={true}
          particleBaseSize={50}
          sizeRandomness={0.5}
          cameraDistance={15}
          disableRotation={false}
        />
      </div>
      <div className="content">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/robots" element={<RobotShowcase />} />
          <Route
            path="/uploader"
            element={user ? (<UploaderPage user={user} />) : (<Navigate to="/login" replace />)}
/>
          <Route
            path="/timeslots"
            element={
              user ? (
                <TimeSlot user={user} setUser={setUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
