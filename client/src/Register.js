import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

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
      console.error(error);
      alert('Error occurred during registration');
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown}
          autoFocus />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
        <button onClick={handleRegister}>Register</button>
      </div>
    </div>
  );
}

export default Register;
