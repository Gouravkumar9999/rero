import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Footer from './Footer';
import Register from './Register';
import TimeSlot from './TimeSlot';
import UploaderPage from './UploaderPage.js'
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply the background and text color globally
  return (
    <Router>
        <div className="flex-grow">
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      <Navbar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Routes>
          <Route path="/" element={<Home sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
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
        <Footer />
      </div>
      </div>
    </Router>
  );
}

export default App;