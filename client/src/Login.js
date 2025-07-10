import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { initializeSocket } from './socket';

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginFailed, setLoginFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setLoginFailed(false);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post('http://localhost:8000/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token = response.data.access_token || response.data.token;
      const userId = response.data.userId;
      if (!userId || isNaN(userId)) throw new Error('Invalid user ID');

      const userData = {
        id: userId,
        username: response.data.username || username,
        token
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      initializeSocket(token);
      navigate('/timeslots');
    } catch (error) {
      setLoginFailed(true);
      setErrorMessage(
        error.response?.data?.detail || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && username && password) handleLogin();
  };

  return (
    <div className="flex justify-center items-center min-h-[90vh] bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-8 rounded-lg shadow-lg w-full max-w-md text-center transition-colors">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="block w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <input
          type="password"
          placeholder="Password"
          className="block w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleLogin}
          disabled={loading || !username || !password}
          className="w-full py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold transition"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {loginFailed && (
          <div className="mt-5 text-red-600">
            <p>{errorMessage}</p>
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-600 underline dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300">
                Register here.
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
