import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@ocean-pulse/shared';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('ocean_pulse_token');
    socket = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[SocketClient] Connected to Ocean Pulse real-time server.');
    });

    socket.on('disconnect', (reason) => {
      console.log('[SocketClient] Disconnected:', reason);
    });
  }
  return socket;
}

export function subscribeToShore(onFleetState: (data: any) => void) {
  const s = getSocket();
  s.emit(SOCKET_EVENTS.SUBSCRIBE_SHORE);
  s.on(SOCKET_EVENTS.FLEET_STATE, onFleetState);

  return () => {
    s.off(SOCKET_EVENTS.FLEET_STATE, onFleetState);
  };
}

export function subscribeToVessel(vesselId: string, onUpdate: (vessel: any) => void) {
  const s = getSocket();
  s.emit(SOCKET_EVENTS.SUBSCRIBE_VESSEL, vesselId);
  s.on(SOCKET_EVENTS.VESSEL_TELEMETRY, onUpdate);

  return () => {
    s.off(SOCKET_EVENTS.VESSEL_TELEMETRY, onUpdate);
  };
}
