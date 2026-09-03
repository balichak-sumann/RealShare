import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = process.env.DATABASE_URL || '';

// Parse the MySQL connection string for the adapter
// Format: mysql://user:password@host:port/database
function parseConnectionString(url: string) {
  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get('ssl-mode') || parsed.searchParams.get('sslmode');
    const sslRequired = sslMode ? sslMode.toUpperCase() !== 'DISABLED' : false;
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '3306', 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace('/', ''),
      ssl: sslRequired ? {} : undefined,
    };
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'realshare',
      ssl: undefined,
    };
  }
}

// Ensure we don't create multiple instances during hot reloading in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
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
  prisma = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
} else {
  prisma = globalForPrisma.prisma;
}

export default prisma;
