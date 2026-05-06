'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, joinAdminRoom, subscribeToAdminEvents, unsubscribeFromAdminEvents } from '@/lib/socket/socketClient';

interface SocketContextType {
  isConnected: boolean;
  joinAdminRoom: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  joinAdminRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = initializeSocket();

    socket.on('connect', () => {
      console.log('Socket connected in frontend');
      setIsConnected(true);
      joinAdminRoom();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected from frontend');
      setIsConnected(false);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, joinAdminRoom }}>
      {children}
    </SocketContext.Provider>
  );
}
