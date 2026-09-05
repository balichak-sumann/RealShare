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

    // Delete the injected documents
    await prisma.kycDocument.deleteMany({
      where: { user_id: latestInvestor.id }
    });

    // Reset status back to not_submitted
    await prisma.profile.update({
      where: { id: latestInvestor.id },
      data: { kyc_status: 'not_submitted' }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Removed fake KYC docs from ${latestInvestor.email}` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
