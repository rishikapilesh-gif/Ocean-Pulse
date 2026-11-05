import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { connectDatabase, prisma } from './prisma/client';
import { requestMeta, errorHandler } from './middleware';
import apiRouter from './routes/api.routes';
import { healthCheck, readinessCheck } from './controllers/status.controller';
import { setupSocketServer, broadcastFleetState } from './realtime/socket';
import { simulator } from './simulation/simulator';
import { seed } from './prisma/seed';

const app = express();
const server = http.createServer(app);

// 1. Basic Middleware
const allowedOrigins = CONFIG.isProduction
  ? ['*']
  : CONFIG.corsOrigins;
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(requestMeta);

// 2. Health & Readiness Root Endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);

// 3. API Routes
app.use('/api/v1', apiRouter);

// 4. Serve Production Web Frontend if built (Render Single-Service Deployment)
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(webDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  });
} else {
  console.warn('[Server] Web dist folder not found. Serving API only.');
}

// 5. Global Error Handler
app.use(errorHandler);

// 6. Real-time WebSockets
setupSocketServer(server);

// 7. Wire Simulator Updates to Real-time Broadcasts
simulator.setOnStateUpdate((state) => {
  broadcastFleetState(state);
});

// 8. Auto-seed: seed on first boot if the Users table is empty
async function autoSeedIfEmpty() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Server] Database is empty — running auto-seed...');
      await seed();
      console.log('[Server] Auto-seed complete.');
    } else {
      console.log(`[Server] Database already seeded (${userCount} users found).`);
    }
  } catch (err: any) {
    // If the table doesn't exist yet (before migration), push the schema first
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      console.log('[Server] Tables not found — pushing schema and seeding...');
      const { execSync } = require('child_process');
      execSync('npx prisma db push --accept-data-loss', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env: process.env,
      });
      await seed();
      console.log('[Server] Schema push + auto-seed complete.');
    } else {
      console.error('[Server] Auto-seed check failed:', err.message);
    }
  }
}

// 9. Graceful Lifecycle & Start
async function bootstrap() {
  try {
    await connectDatabase();
    await autoSeedIfEmpty();

    // Start background simulation loop
    simulator.start();

    const port = CONFIG.port;
    server.listen(port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` OCEAN PULSE — Maritime Decision Support Platform`);
      console.log(` Server active on port: ${port}`);
      console.log(` Operating Mode:   ${CONFIG.demoMode ? 'DEMO MODE (Simulation Active)' : 'PRODUCTION'}`);
      console.log(` Health Endpoint:  /health`);
      console.log(` API Endpoint:     /api/v1`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start Ocean Pulse API service:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  gracefulShutdown();
});

function gracefulShutdown() {
  console.log('\n[Server] Shutting down gracefully...');
  simulator.stop();
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Server] Closed all connections and database pool.');
    process.exit(0);
  });
  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('[Server] Forced exit after 10s timeout.');
    process.exit(1);
  }, 10000);
}

bootstrap();

export { app, server };
