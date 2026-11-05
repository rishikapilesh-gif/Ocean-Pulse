import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const corsRaw = process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
const corsOrigins: string[] | string = corsRaw === '*' ? '*' as any : corsRaw.split(',').map((s) => s.trim());

export const CONFIG = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'ocean-pulse-secret-key-hackathon-2026-safe',
  sessionExpiry: process.env.SESSION_EXPIRY || '7d',
  corsOrigins,
  demoMode: process.env.DEMO_MODE !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  mapProvider: process.env.MAP_PROVIDER || 'leaflet-osm',
  mapTileUrl: process.env.MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  aiProvider: process.env.AI_PROVIDER || 'fallback',
  aiEndpoint: process.env.AI_ENDPOINT || 'http://127.0.0.1:11434/api/generate',
  aiModel: process.env.AI_MODEL || 'qwen2.5',
  aiApiKey: process.env.AI_API_KEY || '',
};
