import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
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
        if (!userId || isNaN(userId)) {
          console.error('[ERROR] Invalid userId received from backend:', userId);
          throw new Error('Invalid user ID');
        }
      const usernameFromResponse = response.data.username || username;

      if (!token) {
        throw new Error('No authentication token received');
      }

      const userData = {
        id: userId ,
        username: usernameFromResponse,
        token: token
      };

      localStorage.setItem('user', JSON.stringify(userData));
      console.log("Stored user:", JSON.parse(localStorage.getItem("user")));

      setUser(userData);
      initializeSocket(token);
      
      navigate('/timeslots');

    } catch (error) {
      console.error('Login error:', {
        error: error.message,
        response: error.response?.data
      });
      setLoginFailed(true);
      setErrorMessage(
        error.response?.data?.detail ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && username && password) {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleLogin} disabled={loading || !username || !password}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {loginFailed && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <p>{errorMessage}</p>
            <p>Don't have an account? <Link to="/register">Register here</Link>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
