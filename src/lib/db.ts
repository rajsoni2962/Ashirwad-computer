import { PrismaClient } from '@prisma/client';
import { isProductionDatabase, ProductionDatabaseProtectionError } from './db-guard';
import { isTestContext } from './test-db';
import { logSecurityEvent } from './security-logger';

/**
 * Optimizes the PostgreSQL database URL for serverless environments (e.g. Vercel).
 * If the connection URL uses Supabase Session Mode (:5432) which has a strict limit of 15 connections,
 * this automatically redirects to Transaction Mode (:6543) with PgBouncer enabled and connection_limit=1
 * to prevent FATAL: (EMAXCONNSESSION) max clients reached in session mode.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // MongoDB Atlas URLs are already connection pooled by the MongoDB driver
  if (url.startsWith('mongodb')) {
    return url;
  }

  // Auto-rewrite Supabase Session mode pooler (:5432) to Transaction mode pooler (:6543)
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace(':5432', ':6543');
  }

  // Ensure pgbouncer and adequate connection_limit for interactive transactions in serverless environments
  if (url.includes(':6543') || url.includes('pooler.supabase.com')) {
    const hasParams = url.includes('?');
    if (!url.includes('pgbouncer=true')) {
      url += (hasParams ? '&' : '?') + 'pgbouncer=true';
    }
    // Prisma interactive transactions ($transaction) require multiple connections in the pool.
    // connection_limit=1 causes "Transaction not found" errors due to connection pool starvation.
    if (url.includes('connection_limit=1') && !url.includes('connection_limit=10')) {
      url = url.replace('connection_limit=1', 'connection_limit=10');
    } else if (!url.includes('connection_limit=')) {
      url += '&connection_limit=10';
    }
  }

  return url;
}

const optimizedUrl = getOptimizedDatabaseUrl();
if (optimizedUrl) {
  process.env.DATABASE_URL = optimizedUrl;
}

function createGuardedPrismaClient(url?: string): PrismaClient {
  const baseClient = new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: ['error'],
  });

  // Client-level fail-closed mutation guard extension
  const guardedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const writeOperations = [
            'create',
            'createMany',
            'update',
            'updateMany',
            'upsert',
            'delete',
            'deleteMany',
          ];

          if (writeOperations.includes(operation)) {
            // Check if test context is attempting a write on a production database
            if (isTestContext() && isProductionDatabase(url)) {
              const msg = `FAIL-CLOSED INTERCEPTION: Blocked test write on model ${model}.${operation} against live production database!`;
              logSecurityEvent({
                type: 'BLOCKED_PRODUCTION_WRITE',
                message: msg,
                databaseHost: url,
                source: `PrismaGuard:${model}.${operation}`,
              });
              throw new ProductionDatabaseProtectionError(msg);
            }
          }

          return query(args);
        },
      },
    },
  });

  return guardedClient as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ?? createGuardedPrismaClient(optimizedUrl);

// Always store on globalThis to prevent connection leaks across serverless function warm starts
globalForPrisma.prisma = db;
