'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, joinAdminRoom, joinEmployeeRoom } from '@/lib/socket/socketClient';

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

      // Employee: join personal room for permission updates
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.role === "employee" && user.id) {
            joinEmployeeRoom(user.id);
          }
        }
      } catch { /* ignore */ }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected from frontend');
      setIsConnected(false);
    });

    // Listen for realtime permission updates from admin — direct to React state, no localStorage
    socket.on('employee:permissions-updated', (data: { permissions: { module: string; actions: string[] }[]; roleName: string }) => {
      window.dispatchEvent(new CustomEvent("permissions-updated", { detail: data }));
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
