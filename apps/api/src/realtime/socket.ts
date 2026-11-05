import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { CONFIG } from '../config';
import { verifyToken, TokenPayload } from '../security/auth';
import {
  SOCKET_EVENTS,
  ROLES,
  VesselState,
  IncidentRecord,
  AssistanceRequestRecord,
  MessageRecord,
  StormState,
  SimulationState,
} from '@ocean-pulse/shared';

let io: SocketIOServer | null = null;

export function setupSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: CONFIG.corsOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token && typeof token === 'string') {
      const user = verifyToken(token);
      if (user) {
        socket.data.user = user;
      }
    }
    // In demo mode or public viewer mode, allow anonymous connections with restricted viewer privileges
    if (!socket.data.user && CONFIG.demoMode) {
      socket.data.user = {
        userId: 'demo-viewer-' + socket.id,
        name: 'Demo Guest',
        email: 'guest@oceanpulse.local',
        role: ROLES.DEMO_VIEWER,
      };
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user: TokenPayload = socket.data.user;
    console.log(`[Socket] Connected: ${socket.id} (User: ${user?.name || 'Anonymous'}, Role: ${user?.role})`);

    // Handle room subscriptions
    socket.on(SOCKET_EVENTS.SUBSCRIBE_SHORE, () => {
      // Allow shore operators, supervisors, admin, demo viewer
      if (
        user.role === ROLES.ADMIN ||
        user.role === ROLES.SHORE_OPERATOR ||
        user.role === ROLES.SUPERVISOR ||
        user.role === ROLES.DEMO_VIEWER
      ) {
        socket.join('shore-operators');
        console.log(`[Socket] ${socket.id} joined 'shore-operators' room`);
      }
    });

    socket.on(SOCKET_EVENTS.SUBSCRIBE_VESSEL, (vesselId: string) => {
      // Fishermen can only subscribe to their own vessel; shore operators can subscribe to any
      if (
        user.role === ROLES.ADMIN ||
        user.role === ROLES.SHORE_OPERATOR ||
        user.role === ROLES.SUPERVISOR ||
        user.role === ROLES.DEMO_VIEWER ||
        user.assignedVesselId === vesselId
      ) {
        socket.join(`vessel:${vesselId}`);
        console.log(`[Socket] ${socket.id} subscribed to 'vessel:${vesselId}'`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function broadcastFleetState(state: {
  vessels: VesselState[];
  storm: StormState;
  simulation: SimulationState;
}) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.FLEET_STATE, state);

  // Also emit individual updates to vessel-specific rooms
  for (const v of state.vessels) {
    io.to(`vessel:${v.id}`).emit(SOCKET_EVENTS.VESSEL_TELEMETRY, v);
    if (v.assessment) {
      io.to(`vessel:${v.id}`).emit(SOCKET_EVENTS.VESSEL_ASSESSMENT, v.assessment);
    }
  }
}

export function emitIncidentCreated(incident: IncidentRecord) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.INCIDENT_CREATED, incident);
  io.to(`vessel:${incident.vesselId}`).emit(SOCKET_EVENTS.INCIDENT_CREATED, incident);
}

export function emitIncidentUpdated(incident: IncidentRecord) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.INCIDENT_UPDATED, incident);
  io.to(`vessel:${incident.vesselId}`).emit(SOCKET_EVENTS.INCIDENT_UPDATED, incident);
}

export function emitIncidentAcknowledged(data: { incidentId: string; vesselId: string; acknowledgedAt: string; operatorName: string }) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.INCIDENT_ACKNOWLEDGED, data);
  io.to(`vessel:${data.vesselId}`).emit(SOCKET_EVENTS.INCIDENT_ACKNOWLEDGED, data);
}

export function emitRequestCreated(request: AssistanceRequestRecord) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.REQUEST_CREATED, request);
  io.to(`vessel:${request.vesselId}`).emit(SOCKET_EVENTS.REQUEST_CREATED, request);
}

export function emitRequestUpdated(request: AssistanceRequestRecord) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.REQUEST_UPDATED, request);
  io.to(`vessel:${request.vesselId}`).emit(SOCKET_EVENTS.REQUEST_UPDATED, request);
}

export function emitMessageReceived(message: MessageRecord) {
  if (!io) return;
  io.to('shore-operators').emit(SOCKET_EVENTS.MESSAGE_RECEIVED, message);
  if (message.vesselId) {
    io.to(`vessel:${message.vesselId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, message);
  }
}
