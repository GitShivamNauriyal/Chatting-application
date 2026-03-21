import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io("https://workspace-chat-backend.onrender.com", {
  transports: ["websocket"],
  withCredentials: true
});

function Chat({ token, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);

  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const payload = JSON.parse(atob(token.split('.')[1])); 
  const currentUserId = payload.userId;
  const currentUsername = payload.username || payload.name || 'Someone';

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const loadChannelData = async (channel) => {
    setActiveChannel(channel);
    try {
      const msgRes = await axios.get(`https://workspace-chat-backend.onrender.com/api/messages/${channel._id}`, axiosConfig);
      setMessages(msgRes.data);
      socket.emit('join_channel', channel._id);
    } catch (err) {
      console.error("Error loading messages", err);
    }
  };

  const loadWorkspaceData = async (workspace) => {
    setActiveWorkspace(workspace);
    try {
      const chRes = await axios.get(`https://workspace-chat-backend.onrender.com/api/channels/${workspace._id}`, axiosConfig);
      setChannels(chRes.data);
      
      if (chRes.data.length > 0) {
        loadChannelData(chRes.data[0]);
      } else {
        setActiveChannel(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading workspace data", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wsRes = await axios.get('https://workspace-chat-backend.onrender.com/api/workspaces', axiosConfig);
        setWorkspaces(wsRes.data);

        if (wsRes.data.length > 0) {
          loadWorkspaceData(wsRes.data[0]);
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();

    socket.emit('register_user', currentUserId);

    socket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('user_typing', (username) => {
      setTypingUser(username);
    });

    socket.on('user_stopped_typing', () => {
      setTypingUser(null);
    });

    socket.on('online_users', (usersArray) => {
      setOnlineUsers(usersArray);
    });

    // --- NEW: Listen for deleted messages from others ---
    socket.on('message_deleted', (deletedMessageId) => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== deletedMessageId));
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('online_users');
      socket.off('message_deleted');
    };
  }, [token, currentUserId]);

  const handleCreateWorkspace = async () => {
    const workspaceName = window.prompt("Enter a name for your new workspace:");
    if (!workspaceName) return;

    try {
      await axios.post(
        'https://workspace-chat-backend.onrender.com/api/workspaces',
        { name: workspaceName },
        axiosConfig
      );
      window.location.reload(); 
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleJoinWorkspace = async () => {
    const joinId = window.prompt("Paste the Workspace Invite ID here:");
    if (!joinId) return;

    try {
      await axios.post(
        'https://workspace-chat-backend.onrender.com/api/workspaces/join',
        { workspaceId: joinId },
        axiosConfig
      );
      window.location.reload(); 
    } catch (error) {
      alert(error.response?.data?.message || "Error joining workspace.");
    }
  };

  const copyWorkspaceId = () => {
    if (activeWorkspace) {
      navigator.clipboard.writeText(activeWorkspace._id);
      alert("Workspace ID copied!");
    }
  };

  const handleCreateChannel = async () => {
    if (!activeWorkspace) return;

    const channelName = window.prompt("Enter a name for your new channel:");
    if (!channelName) return;

    try {
      await axios.post(
        `https://workspace-chat-backend.onrender.com/api/channels/${activeWorkspace._id}`,
        { name: channelName },
        axiosConfig
      );
      loadWorkspaceData(activeWorkspace); 
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  // --- NEW: Delete message function ---
  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        // 1. Delete from database
        await axios.delete(`https://workspace-chat-backend.onrender.com/api/messages/${messageId}`, axiosConfig);
        
        // 2. Remove from your own screen instantly
        setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
        
        // 3. Tell everyone else in the room to remove it
        socket.emit('delete_message', { messageId, channelId: activeChannel._id });
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Could not delete message.");
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (activeChannel) {
      socket.emit('typing', { channelId: activeChannel._id, username: currentUsername });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', activeChannel._id);
      }, 2000);
    }
  };

const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeChannel) {
      try {
        // 1. Save the message to MongoDB
        const res = await axios.post(
          'https://workspace-chat-backend.onrender.com/api/messages',
          { content: newMessage, channelId: activeChannel._id },
          axiosConfig
        );
        
        const savedMessage = res.data;

        // 2. Put the message on YOUR screen
        setMessages((prevMessages) => [...prevMessages, savedMessage]);

        // --- THE FIX IS HERE ---
        // 3. We must explicitly tell the socket which channelId to broadcast to!
        const socketPayload = {
            ...savedMessage,
            channelId: activeChannel._id
        };

        // 4. Broadcast the message to your friends
        socket.emit('send_message', socketPayload);
        socket.emit('stop_typing', activeChannel._id); 
        
        // 5. Clear the input box
        setNewMessage(''); 
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#2C2D30', color: 'white', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <h2>Workspace Chat</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
          <h4 style={{ color: '#aaa', margin: 0, textTransform: 'uppercase', fontSize: '12px' }}>Workspaces</h4>
          <div>
            <button onClick={handleJoinWorkspace} style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '12px', marginRight: '8px', textDecoration: 'underline' }}>Join</button>
            <button onClick={handleCreateWorkspace} style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '16px' }}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px', maxHeight: '150px', overflowY: 'auto' }}>
          {workspaces.map((ws) => (
            <div 
              key={ws._id} 
              onClick={() => loadWorkspaceData(ws)}
              style={{ 
                padding: '6px 8px', 
                cursor: 'pointer', 
                borderRadius: '4px', 
                backgroundColor: activeWorkspace?._id === ws._id ? '#4A4C52' : 'transparent', 
                fontWeight: activeWorkspace?._id === ws._id ? 'bold' : 'normal',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ws.name}
              </span>
              
              {/* --- NEW: Member Count Badge --- */}
              <span 
                style={{ 
                  fontSize: '10px', 
                  backgroundColor: '#1a1d21', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  color: '#aaa',
                  marginLeft: '8px'
                }}
                title="Workspace Members"
              >
                👤 {ws.members?.length || 1}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
          <h4 style={{ color: '#aaa', margin: 0, textTransform: 'uppercase', fontSize: '12px' }}>Channels</h4>
          <button 
            onClick={handleCreateChannel} 
            disabled={!activeWorkspace}
            style={{ background: 'transparent', color: activeWorkspace ? '#aaa' : '#555', border: 'none', cursor: activeWorkspace ? 'pointer' : 'not-allowed', fontSize: '16px' }}
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {channels.map((ch) => (
            <div 
              key={ch._id} 
              onClick={() => loadChannelData(ch)}
              style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', backgroundColor: activeChannel?._id === ch._id ? '#1164A3' : 'transparent', color: activeChannel?._id === ch._id ? 'white' : '#ccc' }}
            >
              # {ch.name}
            </div>
          ))}
          {channels.length === 0 && <div style={{ color: '#777', fontSize: '13px', padding: '8px' }}>No channels yet</div>}
        </div>
        
        <button onClick={onLogout} style={{ marginTop: 'auto', padding: '10px', background: '#E01E5A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{activeChannel ? `# ${activeChannel.name}` : 'Welcome!'}</h3>
          
          {activeWorkspace && (
            <button 
              onClick={copyWorkspaceId} 
              style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Copy Invite ID
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fff', position: 'relative' }}>
          {messages.map((msg, index) => {
            const isOnline = onlineUsers.includes(msg.sender?._id || currentUserId);
            
            // Check if this message was sent by the currently logged-in user
            const isMyMessage = (msg.sender?._id === currentUserId) || (!msg.sender?._id && msg.senderId === currentUserId);
            
            return (
              <div key={index} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>{msg.sender?.username || 'You'}</strong> 
                  
                  {isOnline && (
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#2ea043', borderRadius: '50%', boxShadow: '0 0 4px #2ea043' }} title="Online"></span>
                  )}
                  
                  <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  
                  {/* --- NEW: Delete Button (Only shows on your own messages) --- */}
                  {isMyMessage && msg._id && (
                    <button 
                      onClick={() => handleDeleteMessage(msg._id)}
                      style={{ background: 'transparent', border: 'none', color: '#E01E5A', fontSize: '12px', cursor: 'pointer', marginLeft: '10px', padding: '2px 6px', borderRadius: '4px' }}
                      title="Delete Message"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#333', fontSize: '15px', lineHeight: '1.4' }}>{msg.content}</p>
              </div>
            );
          })}
          
          {typingUser && (
            <div style={{ fontStyle: 'italic', color: '#888', fontSize: '13px', marginBottom: '10px' }}>
              {typingUser} is typing...
            </div>
          )}

          <div ref={messagesEndRef} />

          {!activeChannel && (
            <div style={{ color: 'gray', textAlign: 'center', marginTop: '50px' }}>
              Select or create a channel to start messaging.
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} style={{ padding: '20px', backgroundColor: 'white', display: 'flex' }}>
          <input 
            type="text" 
            value={newMessage} 
            onChange={handleTyping}
            placeholder={activeChannel ? `Message #${activeChannel.name}` : "Select a channel to start chatting..."} 
            disabled={!activeChannel}
            style={{ flex: 1, padding: '12px 16px', fontSize: '15px', border: '1px solid #ccc', borderRadius: '8px', outline: 'none' }}
          />
          <button type="submit" disabled={!activeChannel} style={{ padding: '0 24px', marginLeft: '12px', backgroundColor: activeChannel ? '#007A5A' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: activeChannel ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;