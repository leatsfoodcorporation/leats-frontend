'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    // Debug: Log all incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`📥 Socket event received: ${eventName}`, args);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinAdminRoom = (): void => {
  if (socket) {
    socket.emit('admin:join');
  }
};

export const joinEmployeeRoom = (employeeId: string): void => {
  if (socket) {
    socket.emit('employee:join', { employeeId });
  }
};

export const joinOrderRoom = (orderId: string): void => {
  if (socket) {
    socket.emit('order:join', { orderId });
  }
};

export const leaveOrderRoom = (orderId: string): void => {
  if (socket) {
    socket.emit('order:leave', { orderId });
  }
};

export const subscribeToEvent = (event: string, callback: (data: any) => void): void => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const unsubscribeFromEvent = (event: string, callback?: (data: any) => void): void => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};

export const subscribeToAdminEvents = (callbacks: {
  onPartnerLocation?: (data: any) => void;
  onPartnerOffline?: (data: any) => void;
  onPartnerOnline?: (data: any) => void;
  onNewOrder?: (data: any) => void;
  onDeliveryUpdate?: (data: any) => void;
  onOrderStatusUpdated?: (data: any) => void;
}) => {
  if (socket) {
    console.log('📡 Subscribing to admin events:', Object.keys(callbacks).filter(k => callbacks[k as keyof typeof callbacks]));

    if (callbacks.onPartnerLocation) {
      socket.on('admin:partner-location', (data) => {
        console.log('📍 Received partner location update:', data);
        callbacks.onPartnerLocation!(data);
      });
    }
    if (callbacks.onPartnerOffline) {
      socket.on('admin:partner-offline', callbacks.onPartnerOffline);
    }
    if (callbacks.onPartnerOnline) {
      socket.on('admin:partner-online', callbacks.onPartnerOnline);
    }
    if (callbacks.onNewOrder) {
      socket.on('new_order', callbacks.onNewOrder);
    }
    if (callbacks.onDeliveryUpdate) {
      socket.on('delivery:update', callbacks.onDeliveryUpdate);
    }
    if (callbacks.onOrderStatusUpdated) {
      socket.on('order_status_updated', callbacks.onOrderStatusUpdated);
    }
  }
};

export const unsubscribeFromAdminEvents = (): void => {
  if (socket) {
    socket.off('admin:partner-location');
    socket.off('admin:partner-offline');
    socket.off('admin:partner-online');
    socket.off('new_order');
    socket.off('delivery:update');
    socket.off('order_status_updated');
  }
};

export const subscribeToOrderEvents = (
  orderId: string,
  callbacks: {
    onDeliveryUpdate?: (data: any) => void;
    onPartnerLocation?: (data: any) => void;
  }
): void => {
  if (socket) {
    joinOrderRoom(orderId);
    
    if (callbacks.onDeliveryUpdate) {
      socket.on('delivery:update', callbacks.onDeliveryUpdate);
    }
    if (callbacks.onPartnerLocation) {
      socket.on('partner:location', callbacks.onPartnerLocation);
    }
  }
};

export const unsubscribeFromOrderEvents = (orderId: string): void => {
  if (socket) {
    leaveOrderRoom(orderId);
    socket.off('delivery:update');
    socket.off('partner:location');
  }
};
