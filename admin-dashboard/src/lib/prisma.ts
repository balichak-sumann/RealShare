import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { createAuditExtension } from './prisma-audit';



/**
 * Render exposes two connection strings for the same database:
 *   external  dpg-xxxx-a.<region>-postgres.render.com  -> reachable from outside, needs TLS
 *   internal  dpg-xxxx-a                               -> private network, TLS not required
 *
 * The sslmode parameter has to be removed for the internal host, but it must be
 * removed as a QUERY PARAMETER, not by string replacement: the production URL is
 * `...?sslmode=require&connection_limit=5`, so stripping the literal
 * "?sslmode=require" leaves "...realshare_qn3n&connection_limit=5" and the
 * database name silently becomes "realshare_qn3n&connection_limit=5" — which
 * does not exist, so the app cannot connect at all. Dev never hit this because
 * dev uses the external URL and takes the other branch.
 */
function resolveConnection(raw: string | undefined): {
  connectionString: string | undefined;
  useSsl: boolean;
} {
  if (!raw) return { connectionString: raw, useSsl: false };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Not a URL we can parse — leave it exactly as provided.
    return { connectionString: raw, useSsl: false };
  }

  // Only a real render.com hostname counts as external; matching on the raw
  // string would also match a password that happened to contain "render.com".
  if (url.hostname.endsWith('.render.com')) {
    return { connectionString: raw, useSsl: true };
  }

  url.searchParams.delete('sslmode');
  return { connectionString: url.toString(), useSsl: false };
}

const { connectionString, useSsl } = resolveConnection(process.env.DATABASE_URL);

function createClient() {
  const pool = new Pool({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });
  const adapter = new PrismaPg(pool);
  const base = new PrismaClient({ adapter });

  return base.$extends(createAuditExtension(base));
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;
const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

let prisma: ExtendedPrismaClient;

if (!globalForPrisma.prisma || !(globalForPrisma.prisma as any).premiumService) {
  prisma = createClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Trigger hot reload
} else {
  prisma = globalForPrisma.prisma;
}

export default prisma;
