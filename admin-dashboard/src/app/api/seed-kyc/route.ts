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
      return NextResponse.json({ error: 'No investor profiles found to seed.' }, { status: 400 });
    }

    await prisma.profile.update({
      where: { id: latestInvestor.id },
      data: { kyc_status: 'pending' }
    });

    await prisma.kycDocument.upsert({
      where: {
        user_id_document_type: {
          user_id: latestInvestor.id,
          document_type: 'aadhaar'
        }
      },
      update: {
        document_number: '1234-5678-9012',
        document_front_url: 'https://images.unsplash.com/photo-1621360841013-c76831f12285?w=500&auto=format&fit=crop',
        document_back_url: 'https://images.unsplash.com/photo-1621360841013-c76831f12285?w=500&auto=format&fit=crop',
        verification_status: 'pending'
      },
      create: {
        user_id: latestInvestor.id,
        document_type: 'aadhaar',
        document_number: '1234-5678-9012',
        document_front_url: 'https://images.unsplash.com/photo-1621360841013-c76831f12285?w=500&auto=format&fit=crop',
        document_back_url: 'https://images.unsplash.com/photo-1621360841013-c76831f12285?w=500&auto=format&fit=crop',
        verification_status: 'pending'
      }
    });

    await prisma.kycDocument.upsert({
      where: {
        user_id_document_type: {
          user_id: latestInvestor.id,
          document_type: 'pan'
        }
      },
      update: {
        document_number: 'ABCDE1234F',
        document_front_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop',
        verification_status: 'pending'
      },
      create: {
        user_id: latestInvestor.id,
        document_type: 'pan',
        document_number: 'ABCDE1234F',
        document_front_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop',
        verification_status: 'pending'
      }
    });

    return NextResponse.json({ success: true, message: 'Seeded KYC successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
