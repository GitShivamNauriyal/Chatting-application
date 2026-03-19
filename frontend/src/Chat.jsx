import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://workspace-chat-backend.onrender.com');

function Chat({ token, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wsRes = await axios.get('https://workspace-chat-backend.onrender.com/api/workspaces', axiosConfig);
        if (wsRes.data.length > 0) {
          const workspaceId = wsRes.data[0]._id; 
          
          const chRes = await axios.get(`https://workspace-chat-backend.onrender.com/api/channels/${workspaceId}`, axiosConfig);
          if (chRes.data.length > 0) {
            const channel = chRes.data[0]; 
            setActiveChannel(channel);

            const msgRes = await axios.get(`https://workspace-chat-backend.onrender.com/api/messages/${channel._id}`, axiosConfig);
            setMessages(msgRes.data);

            socket.emit('join_channel', channel._id);
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();

    socket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [token]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeChannel) {
      const payload = JSON.parse(atob(token.split('.')[1])); 

      const messageData = {
        content: newMessage,
        senderId: payload.userId,
        channelId: activeChannel._id
      };

      socket.emit('send_message', messageData);
      setNewMessage(''); 
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', backgroundColor: '#2C2D30', color: 'white', padding: '20px' }}>
        <h2>Workspace Chat</h2>
        <h4 style={{ color: '#aaa' }}># {activeChannel ? activeChannel.name : 'Loading...'}</h4>
        <button onClick={onLogout} style={{ position: 'absolute', bottom: '20px', padding: '10px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '15px' }}>
              <strong>{msg.sender?.username || 'You'}</strong> <span style={{ fontSize: '12px', color: 'gray' }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
              <p style={{ margin: '5px 0 0 0' }}>{msg.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #ccc', display: 'flex' }}>
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;