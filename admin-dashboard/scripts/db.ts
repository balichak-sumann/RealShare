import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Shared MySQL (GoDaddy cPanel) Prisma client factory for standalone scripts.
// Mirrors src/lib/prisma.ts — scripts run outside Next.js, so they build their
// own short-lived client instead of using the app's cached singleton.
function parseConnectionString(url: string) {
  const parsed = new URL(url);
  const sslMode = parsed.searchParams.get('ssl-mode') || parsed.searchParams.get('sslmode');
  const sslRequired = sslMode ? sslMode.toUpperCase() !== 'DISABLED' : false;
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306', 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    ssl: sslRequired ? {} : undefined,
  };
}

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || '';
  const dbConfig = parseConnectionString(connectionString);
  const adapter = new PrismaMariaDb({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    connectionLimit: 5,
    ssl: dbConfig.ssl,
  });
  return new PrismaClient({ adapter });
}
