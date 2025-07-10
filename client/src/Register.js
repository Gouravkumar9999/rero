import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Registered successfully. Please log in.');
        navigate('/login');
      } else {
        const err = await res.json();
        alert(err.detail || 'Registration failed');
      }
    } catch (error) {
      alert('Error occurred during registration');
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[90vh] bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="bg-cyan-500/90 dark:bg-cyan-700/90 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6 text-white">Register</h2>
        <input
          type="text"
          placeholder="Username"
          className="block w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-gray-900 dark:text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          className="block w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-gray-900 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleRegister}
          className="w-full py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold transition"
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default Register;