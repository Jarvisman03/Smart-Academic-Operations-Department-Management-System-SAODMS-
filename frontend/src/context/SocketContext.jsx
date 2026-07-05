import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const dashboardRef = useRef(null);
  const notificationsRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    const token = getAccessToken();
    const opts = { auth: { token }, transports: ['websocket', 'polling'] };

    const dashboard = io(`${SOCKET_URL}/dashboard`, opts);
    const notifications = io(`${SOCKET_URL}/notifications`, opts);
    const chat = io(`${SOCKET_URL}/chat`, opts);

    dashboard.on('connect', () => setConnected(true));
    dashboard.on('disconnect', () => setConnected(false));

    dashboardRef.current = dashboard;
    notificationsRef.current = notifications;
    chatRef.current = chat;

    return () => {
      dashboard.disconnect();
      notifications.disconnect();
      chat.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ connected, dashboard: dashboardRef, notifications: notificationsRef, chat: chatRef }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
