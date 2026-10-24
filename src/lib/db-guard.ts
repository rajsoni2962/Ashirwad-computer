import { logSecurityEvent, sanitizeLogString } from './security-logger';

export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export class ProductionDatabaseProtectionError extends Error {
  public readonly code = 'PRODUCTION_DATABASE_PROTECTED';
  constructor(message: string) {
    super(message);
    this.name = 'ProductionDatabaseProtectionError';
  }
}

/**
 * Resolves application environment with a fail-closed default.
 * If NODE_ENV or APP_ENV is undefined or ambiguous, defaults to 'production'.
 */
export function getAppEnvironment(): AppEnvironment {
  const env = (process.env.APP_ENV || process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'test') return 'test';
  if (env === 'development' || env === 'dev') return 'development';
  if (env === 'staging') return 'staging';
  // Fail-closed security rule: default to production
  return 'production';
}

/**
 * Known indicators of production or remote cloud database hosts.
 */
const PRODUCTION_HOST_PATTERNS = [
  'supabase.com',
  'supabase.co',
  'pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'teqfmeipvxkoflihmwun',
  'rds.amazonaws.com',
  'render.com',
  'railway.app',
  'neon.tech',
  'cockroachlabs.cloud',
  'mongodb.net',
];

/**
 * Determines whether a given database URL points to a production or live cloud database.
 * Uses fail-closed semantics: if a remote host is detected, it is classified as production.
 */
export function isProductionDatabase(dbUrl?: string): boolean {
  const url = (dbUrl || process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();
  if (!url) return true; // Fail-closed: missing URL assumed production/unsafe

  // Explicit check for known production hosts
  for (const pattern of PRODUCTION_HOST_PATTERNS) {
    if (url.toLowerCase().includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check if it's a dedicated local test database (SQLite file or localhost test database)
  const isLocalFile = url.startsWith('file:') || url.includes('.db');
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');
  const isDedicatedTestDb = isLocalFile || (isLocalhost && url.toLowerCase().includes('test'));

  if (isDedicatedTestDb) {
    return false;
  }

  // If not local file or localhost, it's an unrecognized remote database -> treat as production
  if (!isLocalhost) {
    return true;
  }

  // If it is localhost but NOT explicitly a test database, and environment is production, treat as production
  if (getAppEnvironment() === 'production') {
    return true;
  }

  return false;
}

/**
 * Verifies that a database URL points to a verified safe test database.
 * Safe test database criteria:
 * 1. Must be local SQLite (file: or .db) OR localhost Postgres whose name contains 'test'.
 * 2. Must NOT match any production cloud patterns.
 * 3. Must NOT be the live production database URL.
 */
export function isSafeTestDatabase(dbUrl?: string): boolean {
  const url = (dbUrl || process.env.TEST_DATABASE_URL || '').trim();
  if (!url) return false;

  // Never safe if it matches a production host pattern
  if (isProductionDatabase(url)) return false;

  const isLocalFile = url.startsWith('file:') || url.includes('.db');
  const isLocalhostTestDb =
    (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1')) &&
    url.toLowerCase().includes('test');

  return isLocalFile || isLocalhostTestDb;
}

/**
 * Fail-Closed Guard: Ensures test scripts, automated suites, or test runners
 * NEVER execute against a production database.
 */
export function assertSafeForTesting(options?: { dbUrl?: string; scriptName?: string }) {
  const targetUrl = options?.dbUrl || process.env.DATABASE_URL || '';
  const scriptName = options?.scriptName || 'test-runner';

  if (isProductionDatabase(targetUrl)) {
    const errorMsg = `CRITICAL SECURITY ABORT: ${scriptName} attempted to run against a live/production database! Automated tests are strictly prohibited from writing to or executing against the live database.`;
    
    logSecurityEvent({
      type: 'BLOCKED_PRODUCTION_TEST',
      message: errorMsg,
      databaseHost: targetUrl,
      environment: getAppEnvironment(),
      source: scriptName,
    });

    throw new ProductionDatabaseProtectionError(
      `${errorMsg}\nTarget URL: ${sanitizeLogString(targetUrl)}\nPlease configure TEST_DATABASE_URL with an isolated test database (e.g. file:./prisma/test.db).`
    );
  }
}

/**
 * Fail-Closed Guard: Ensures demo-data seeding NEVER executes against production.
 */
export function assertSafeForSeed(options?: { dbUrl?: string; scriptName?: string }) {
  const targetUrl = options?.dbUrl || process.env.DATABASE_URL || '';
  const scriptName = options?.scriptName || 'prisma-seed';

  if (isProductionDatabase(targetUrl)) {
    const errorMsg = `CRITICAL SECURITY ABORT: Demo-data seeding is strictly prohibited on production database! Seeding would insert synthetic records into live business data.`;

    logSecurityEvent({
      type: 'BLOCKED_PRODUCTION_SEED',
      message: errorMsg,
      databaseHost: targetUrl,
      environment: getAppEnvironment(),
      source: scriptName,
    });

    throw new ProductionDatabaseProtectionError(
      `${errorMsg}\nTarget URL: ${sanitizeLogString(targetUrl)}\nDemo seeding is only permitted in development or test environments on verified non-production databases.`
    );
  }
}

/**
 * Fail-Closed Guard: Ensures destructive resets NEVER execute against production.
 */
export function assertSafeForReset(options?: { dbUrl?: string; scriptName?: string }) {
  const targetUrl = options?.dbUrl || process.env.DATABASE_URL || '';
  const scriptName = options?.scriptName || 'database-reset';

  if (isProductionDatabase(targetUrl)) {
    const errorMsg = `CRITICAL SECURITY ABORT: Destructive database reset is strictly prohibited on production database! Wiping tables in production is permanently blocked.`;

    logSecurityEvent({
      type: 'BLOCKED_PRODUCTION_WRITE',
      message: errorMsg,
      databaseHost: targetUrl,
      environment: getAppEnvironment(),
      source: scriptName,
    });

    throw new ProductionDatabaseProtectionError(
      `${errorMsg}\nTarget URL: ${sanitizeLogString(targetUrl)}\nRefusing to wipe production database.`
    );
  }
}
