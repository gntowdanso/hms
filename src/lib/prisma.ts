import { PrismaClient } from '@prisma/client';

const _global = globalThis as any;
_global.__prisma = _global.__prisma ?? null;

// Use `any` for the default export to avoid TypeScript model-property mismatches
export const prisma: any = _global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  _global.__prisma = prisma;
}

export default prisma as any;
