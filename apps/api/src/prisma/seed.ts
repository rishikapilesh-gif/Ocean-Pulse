import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  INITIAL_FLEET,
  DEFAULT_HAZARDS,
  ROLES,
  WORLD_BOUNDS,
} from '@ocean-pulse/shared';

const prisma = new PrismaClient();

export async function seed() {
  console.log('[Seed] Seeding database...');

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);

  const users = [
    {
      name: 'Radhakrishnan Nair (Admin)',
      email: 'admin@oceanpulse.org',
      passwordHash: await bcrypt.hash('AdminPass123!', salt),
      role: ROLES.ADMIN,
    },
    {
      name: 'Kavitha Menath (Shore Operator)',
      email: 'operator@oceanpulse.org',
      passwordHash: await bcrypt.hash('ShorePass123!', salt),
      role: ROLES.SHORE_OPERATOR,
    },
    {
      name: 'Cmdr. Suresh Babu (Supervisor)',
      email: 'supervisor@oceanpulse.org',
      passwordHash: await bcrypt.hash('SuperPass123!', salt),
      role: ROLES.SUPERVISOR,
    },
    {
      name: 'Antony Joseph (Fisherman - Sagar Kanya)',
      email: 'fisher@oceanpulse.org',
      passwordHash: await bcrypt.hash('FisherPass123!', salt),
      role: ROLES.FISHERMAN,
      assignedVesselId: 'B01',
    },
    {
      name: 'Hackathon Evaluator (Demo Viewer)',
      email: 'viewer@oceanpulse.org',
      passwordHash: await bcrypt.hash('DemoPass123!', salt),
      role: ROLES.DEMO_VIEWER,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        assignedVesselId: u.assignedVesselId || null,
        passwordHash: u.passwordHash,
      },
      create: u,
    });
  }
  console.log(`[Seed] Seeded ${users.length} users.`);

  // 2. Seed Vessels
  for (const v of INITIAL_FLEET) {
    await prisma.vessel.upsert({
      where: { id: v.id },
      update: {
        name: v.name,
        regNo: v.regNo,
        masterName: v.master,
        equipmentType: v.type,
      },
      create: {
        id: v.id,
        name: v.name,
        regNo: v.regNo,
        masterName: v.master,
        equipmentType: v.type,
        operatingArea: 'Kochi Offshore & Arabian Sea Shelf',
        status: 'ACTIVE',
      },
    });

    // Seed initial telemetry point
    const lat = WORLD_BOUNDS.originLat + (v.y / WORLD_BOUNDS.kmPerDegreeLat);
    const lng = WORLD_BOUNDS.originLng + (v.x / WORLD_BOUNDS.kmPerDegreeLng);

    await prisma.telemetry.create({
      data: {
        vesselId: v.id,
        lat,
        lng,
        gridX: v.x,
        gridY: v.y,
        speedKmh: v.speedKmh,
        bearingDeg: v.bearing,
        source: 'SIMULATION',
        accuracyMeters: 5.0,
      },
    });
  }
  console.log(`[Seed] Seeded ${INITIAL_FLEET.length} vessels and initial telemetries.`);

  // 3. Seed Hazard Zones
  for (const h of DEFAULT_HAZARDS) {
    await prisma.hazardZone.upsert({
      where: { id: h.id },
      update: {
        name: h.name,
        gridX: h.x,
        gridY: h.y,
        radiusKm: h.r,
        severity: h.severity,
      },
      create: {
        id: h.id,
        name: h.name,
        type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
        gridX: h.x,
        gridY: h.y,
        radiusKm: h.r,
        severity: h.severity,
        isSimulated: true,
      },
    });
  }
  console.log(`[Seed] Seeded ${DEFAULT_HAZARDS.length} hazard zones.`);

  // 4. Seed Data Source Statuses
  const dataSources = [
    {
      sourceName: 'INCOIS Ocean State Forecasts',
      status: 'HEALTHY',
      freshnessThresholdSec: 1800,
      errorDetails: null,
    },
    {
      sourceName: 'IMD Doppler Weather Radar & Cyclone Warning',
      status: 'HEALTHY',
      freshnessThresholdSec: 900,
      errorDetails: null,
    },
    {
      sourceName: 'ISRO NavIC / DAT Satellite Distress Gateway',
      status: 'HEALTHY',
      freshnessThresholdSec: 120,
      errorDetails: null,
    },
    {
      sourceName: 'AIS Coastal VHF Receiver Mesh',
      status: 'HEALTHY',
      freshnessThresholdSec: 300,
      errorDetails: null,
    },
  ];

  for (const ds of dataSources) {
    await prisma.dataSourceStatus.upsert({
      where: { sourceName: ds.sourceName },
      update: {
        status: ds.status,
        freshnessThresholdSec: ds.freshnessThresholdSec,
        lastSuccessfulUpdate: new Date(),
        lastAttemptedUpdate: new Date(),
      },
      create: {
        sourceName: ds.sourceName,
        status: ds.status,
        freshnessThresholdSec: ds.freshnessThresholdSec,
        lastSuccessfulUpdate: new Date(),
        lastAttemptedUpdate: new Date(),
      },
    });
  }
  console.log(`[Seed] Seeded ${dataSources.length} data source status records.`);

  console.log('[Seed] Database seed completed successfully!');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
