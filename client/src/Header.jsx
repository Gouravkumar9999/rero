// src/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">IEEE Robotics & Automation Society</h1>
      <nav>
        <Link to="/" className="mr-4 hover:underline">Home</Link>
        <Link to="/login" className="hover:underline">Login</Link>
      </nav>
    </header>
  );
}

export default Header;
