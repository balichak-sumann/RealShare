import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/realshare';

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

const dbConfig = parseConnectionString(connectionString);
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 1,
  ssl: dbConfig.ssl,
});
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const latestInvestor = await prisma.profile.findFirst({
      where: { role: 'investor' },
      orderBy: { created_at: 'desc' }
    });

    if (!latestInvestor) {
      return NextResponse.json({ error: 'No investor found.' });
    }

    return NextResponse.json({ 
      name: latestInvestor.full_name,
      email: latestInvestor.email,
      phone: latestInvestor.phone_number
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
