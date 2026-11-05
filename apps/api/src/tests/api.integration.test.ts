import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../index';
import { prisma } from '../prisma/client';
import { simulator } from '../simulation/simulator';

describe('Ocean Pulse API Integration Test Suite', () => {
  let authToken = '';

  beforeAll(async () => {
    // Seed user if needed
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'operator@oceanpulse.org', password: 'ShorePass123!' });

    if (res.body?.data?.token) {
      authToken = res.body.data.token;
    }
  });

  afterAll(async () => {
    simulator.stop();
    server.close();
    await prisma.$disconnect();
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.mode).toBe('DEMO');
  });

  it('GET /ready returns database readiness', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('POST /api/v1/auth/login accepts valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'operator@oceanpulse.org', password: 'ShorePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('SHORE_OPERATOR');
  });

  it('POST /api/v1/auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'operator@oceanpulse.org', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/vessels returns ranked vessel fleet', async () => {
    const res = await request(app)
      .get('/api/v1/vessels')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.vessels)).toBe(true);
    expect(res.body.data.vessels.length).toBe(10);
    expect(res.body.data.vessels[0].assessment).toBeDefined();
  });

  it('POST /api/v1/sos correctly persists SOS and safely handles duplicate idempotency retries', async () => {
    const testKey = `test-sos-idempotency-${Date.now()}`;
    const payload = {
      vesselId: 'B01',
      type: 'MANUAL_SOS',
      lat: 9.75,
      lng: 76.35,
      idempotencyKey: testKey,
      notes: 'Test emergency drill message',
    };

    // First submission
    const res1 = await request(app)
      .post('/api/v1/sos')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.isDuplicate).toBe(false);
    expect(res1.body.data.incident.vesselId).toBe('B01');
    expect(res1.body.data.incident.status).toBe('RECEIVED');

    const incidentId = res1.body.data.incident.id;

    // Retry with identical idempotencyKey (simulating network retry or browser reconnection)
    const res2 = await request(app)
      .post('/api/v1/sos')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.isDuplicate).toBe(true);
    expect(res2.body.data.incident.id).toBe(incidentId);

    // Operator acknowledges the incident
    const ackRes = await request(app)
      .post(`/api/v1/incidents/${incidentId}/acknowledge`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ notes: 'Acknowledged by Coast Guard operator on duty' });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.success).toBe(true);
    expect(ackRes.body.data.incident.status).toBe('ACKNOWLEDGED');
    expect(ackRes.body.data.incident.acknowledgedAt).toBeDefined();
  });

  it('POST /api/v1/requests creates assistance request with idempotency', async () => {
    const key = `test-req-${Date.now()}`;
    const payload = {
      vesselId: 'B02',
      category: 'DRINKING_WATER',
      quantityOrDetails: '20 Liters fresh drinking water',
      urgency: 'MEDIUM',
      lat: 9.6,
      lng: 76.1,
      idempotencyKey: key,
    };

    const res1 = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.request.category).toBe('DRINKING_WATER');

    // Duplicate retry
    const res2 = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.data.isDuplicate).toBe(true);
  });

  it('GET /api/v1/simulation/scenarios returns all 5 hackathon scenarios', async () => {
    const res = await request(app).get('/api/v1/simulation/scenarios');
    expect(res.status).toBe(200);
    expect(res.body.data.scenarios.length).toBe(5);
  });

  it('POST /api/v1/simulation/control allows loading scenarios and pause/play', async () => {
    const res = await request(app)
      .post('/api/v1/simulation/control')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ action: 'LOAD_SCENARIO', scenarioId: 'scenario-2' });

    expect(res.status).toBe(200);
    expect(res.body.data.simulation.scenarioId).toBe('scenario-2');
  });
});
