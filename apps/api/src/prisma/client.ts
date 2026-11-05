import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase(retries = 5, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('[Database] Connected successfully.');
      return;
    } catch (error: any) {
      console.error(`[Database] Connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        console.error('[Database] All connection attempts exhausted. Cannot start.');
        throw error;
      }
      console.log(`[Database] Retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
