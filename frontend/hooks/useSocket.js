// hooks/useSocket.js
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔌 Attempting to connect to Socket.IO server...');
    
    // Use explicit IP instead of localhost (IPv4 vs IPv6 issue fix)
    socketRef.current = io('http://127.0.0.1:5000', {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    const socket = socketRef.current;

    // Connection success
    socket.on('connect', () => {
      console.log('✅ Socket.IO Connected:', socket.id);
      setIsConnected(true);
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO Connection Error:', error);
      setIsConnected(false);
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO Disconnected:', reason);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection...');
      socket.disconnect();
    };
  }, []);

  const joinAllPolls = () => {
    console.log('📡 Joining allPolls room...');
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinAllPolls');
    }
  };

  const castVote = (pollId, optionId, userId) => {
    console.log(`🗳️ Casting vote:`, { pollId, optionId, userId });
    if (socketRef.current && isConnected) {
      socketRef.current.emit('castVote', { pollId, optionId, userId });
    } else {
      console.error('❌ Cannot cast vote - socket not connected');
    }
  };

  const onPollUpdated = (callback) => {
    if (socketRef.current) {
      console.log('👂 Listening for pollUpdated events...');
      socketRef.current.on('pollUpdated', (data) => {
        console.log('📊 Poll updated received:', data);
        callback(data);
      });
    }
  };

  const onVoteSuccess = (callback) => {
    if (socketRef.current) {
      console.log('👂 Listening for voteSuccess events...');
      socketRef.current.on('voteSuccess', (data) => {
        console.log('✅ Vote success received:', data);
        callback(data);
      });
    }
  };

  const onVoteError = (callback) => {
    if (socketRef.current) {
      console.log('👂 Listening for voteError events...');
      socketRef.current.on('voteError', (data) => {
        console.log('❌ Vote error received:', data);
        callback(data);
      });
    }
  };

  return {
    isConnected,
    joinAllPolls,
    castVote,
    onPollUpdated,
    onVoteSuccess,
    onVoteError,
    socket: socketRef.current // Expose socket for debugging
  };
};

export default useSocket;
