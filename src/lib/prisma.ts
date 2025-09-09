import { PrismaClient } from '@prisma/client';

// Use a symbol on globalThis to avoid redeclaration/type mismatch during Next.js type analysis
const GLOBAL_PRISMA_KEY: unique symbol = Symbol.for('@@hms/prisma');

// Augment the globalThis type safely
interface PrismaGlobal { [GLOBAL_PRISMA_KEY]?: PrismaClient }
const _global = globalThis as typeof globalThis & PrismaGlobal;

export const prisma: PrismaClient = _global[GLOBAL_PRISMA_KEY] || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  _global[GLOBAL_PRISMA_KEY] = prisma;
}

export default prisma;
