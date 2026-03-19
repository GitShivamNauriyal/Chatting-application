import React, { useState } from 'react';
import axios from 'axios';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        onLogin(res.data.token);
      } else {
        await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
        alert('Registration successful! Please log in.');
        setIsLogin(true); 
      }
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h2>{isLogin ? 'Login to Workspace Chat' : 'Register'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
        
        {!isLogin && (
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      
      <p style={{ cursor: 'pointer', color: 'blue', marginTop: '15px' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default Auth;