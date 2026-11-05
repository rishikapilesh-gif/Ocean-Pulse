import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SOSSubmissionInput, AssistanceRequestInput } from '@ocean-pulse/shared';
import { api } from './api';

interface OceanPulseDB extends DBSchema {
  pendingSOS: {
    key: string;
    value: {
      idempotencyKey: string;
      data: SOSSubmissionInput;
      createdAt: string;
      status: 'PENDING' | 'SYNCED' | 'FAILED';
      retryCount: number;
    };
  };
  pendingRequests: {
    key: string;
    value: {
      idempotencyKey: string;
      data: AssistanceRequestInput;
      createdAt: string;
      status: 'PENDING' | 'SYNCED' | 'FAILED';
      retryCount: number;
    };
  };
  cachedState: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<OceanPulseDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OceanPulseDB>('ocean_pulse_offline_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingSOS')) {
          db.createObjectStore('pendingSOS', { keyPath: 'idempotencyKey' });
        }
        if (!db.objectStoreNames.contains('pendingRequests')) {
          db.createObjectStore('pendingRequests', { keyPath: 'idempotencyKey' });
        }
        if (!db.objectStoreNames.contains('cachedState')) {
          db.createObjectStore('cachedState');
        }
      },
    });
  }
  return dbPromise;
}

export const offlineQueue = {
  async queueSOS(data: SOSSubmissionInput): Promise<void> {
    const db = await getDB();
    await db.put('pendingSOS', {
      idempotencyKey: data.idempotencyKey,
      data,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    });
    console.log(`[OfflineQueue] Queued SOS locally with key: ${data.idempotencyKey}`);
  },

  async queueAssistanceRequest(data: AssistanceRequestInput): Promise<void> {
    const db = await getDB();
    await db.put('pendingRequests', {
      idempotencyKey: data.idempotencyKey,
      data,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    });
    console.log(`[OfflineQueue] Queued Assistance Request locally: ${data.idempotencyKey}`);
  },

  async getPendingCount(): Promise<{ sosCount: number; reqCount: number }> {
    const db = await getDB();
    const allSOS = await db.getAll('pendingSOS');
    const allReq = await db.getAll('pendingRequests');
    return {
      sosCount: allSOS.filter((s) => s.status === 'PENDING').length,
      reqCount: allReq.filter((r) => r.status === 'PENDING').length,
    };
  },

  async syncAllPending(): Promise<{ syncedSOS: number; syncedRequests: number }> {
    if (!navigator.onLine) {
      return { syncedSOS: 0, syncedRequests: 0 };
    }

    const db = await getDB();
    const pendingSOS = await db.getAll('pendingSOS');
    let syncedSOS = 0;

    for (const item of pendingSOS) {
      if (item.status === 'PENDING') {
        try {
          await api.submitSOS(item.data);
          item.status = 'SYNCED';
          await db.put('pendingSOS', item);
          syncedSOS++;
          console.log(`[OfflineQueue] Reconciled and synced SOS: ${item.idempotencyKey}`);
        } catch (err) {
          item.retryCount++;
          await db.put('pendingSOS', item);
          console.warn(`[OfflineQueue] Retry failed for SOS ${item.idempotencyKey}:`, err);
        }
      }
    }

    const pendingRequests = await db.getAll('pendingRequests');
    let syncedRequests = 0;

    for (const item of pendingRequests) {
      if (item.status === 'PENDING') {
        try {
          await api.createAssistanceRequest(item.data);
          item.status = 'SYNCED';
          await db.put('pendingRequests', item);
          syncedRequests++;
          console.log(`[OfflineQueue] Reconciled and synced Request: ${item.idempotencyKey}`);
        } catch (err) {
          item.retryCount++;
          await db.put('pendingRequests', item);
        }
      }
    }

    return { syncedSOS, syncedRequests };
  },

  async saveCachedVessel(vessel: any): Promise<void> {
    const db = await getDB();
    await db.put('cachedState', vessel, 'last_vessel_state');
  },

  async getCachedVessel(): Promise<any | null> {
    const db = await getDB();
    return db.get('cachedState', 'last_vessel_state');
  },
};
