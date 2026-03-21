import React, { useState, useEffect } from 'react';
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
  
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

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

    socket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [token]);

  const handleCreateWorkspace = async () => {
    const workspaceName = window.prompt("Enter a name for your new workspace:");
    if (!workspaceName) return;

    try {
      await axios.post(
        'https://workspace-chat-backend.onrender.com/api/workspaces',
        { name: workspaceName },
        axiosConfig
      );
      alert("Workspace created successfully!");
      window.location.reload(); 
    } catch (error) {
      console.error("Error creating workspace:", error);
      alert("Error creating workspace. Check console.");
    }
  };

  // NEW FUNCTION: Join an existing workspace using an ID
  const handleJoinWorkspace = async () => {
    const joinId = window.prompt("Paste the Workspace Invite ID here:");
    if (!joinId) return;

    try {
      await axios.post(
        'https://workspace-chat-backend.onrender.com/api/workspaces/join',
        { workspaceId: joinId },
        axiosConfig
      );
      alert("Successfully joined the workspace!");
      window.location.reload(); 
    } catch (error) {
      console.error("Error joining workspace:", error);
      alert(error.response?.data?.message || "Error joining workspace. Check the ID.");
    }
  };

  // NEW FUNCTION: Copy the active workspace ID to clipboard
  const copyWorkspaceId = () => {
    if (activeWorkspace) {
      navigator.clipboard.writeText(activeWorkspace._id);
      alert("Workspace ID copied! Send this to your friend so they can join.");
    }
  };

  const handleCreateChannel = async () => {
    if (!activeWorkspace) {
      alert("Please select a workspace first!");
      return;
    }

    const channelName = window.prompt("Enter a name for your new channel (e.g., general, help, random):");
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
      alert("Error creating channel. Check console.");
    }
  };

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
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#2C2D30', color: 'white', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <h2>Workspace Chat</h2>
        
        {/* WORKSPACES SECTION */}
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
              style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', backgroundColor: activeWorkspace?._id === ws._id ? '#4A4C52' : 'transparent', fontWeight: activeWorkspace?._id === ws._id ? 'bold' : 'normal' }}
            >
              {ws.name}
            </div>
          ))}
        </div>

        {/* CHANNELS SECTION */}
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
        
        {/* NEW CHAT HEADER WITH COPY BUTTON */}
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
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fff' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <strong style={{ fontSize: '15px' }}>{msg.sender?.username || 'You'}</strong> 
                <span style={{ fontSize: '12px', color: '#888' }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#333', fontSize: '15px', lineHeight: '1.4' }}>{msg.content}</p>
            </div>
          ))}
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
            onChange={(e) => setNewMessage(e.target.value)} 
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