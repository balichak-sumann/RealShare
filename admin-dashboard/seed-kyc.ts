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

async function seedKyc() {
  try {
    // Find the most recently created investor
    const latestInvestor = await prisma.profile.findFirst({
      where: { role: 'investor' },
      orderBy: { created_at: 'desc' }
    });

    if (!latestInvestor) {
      console.log('No investor profiles found to seed.');
      return;
    }

    console.log(`Seeding KYC for Investor: ${latestInvestor.email || latestInvestor.phone_number || latestInvestor.full_name} (ID: ${latestInvestor.id})`);

    // Update their status to pending
    await prisma.profile.update({
      where: { id: latestInvestor.id },
      data: { kyc_status: 'pending' }
    });

    // Create dummy Aadhaar
    await prisma.kycDocument.upsert({
      where: {
        user_id_document_type: {
          user_id: latestInvestor.id,
          document_type: 'aadhaar'
        }
      },
      update: {
        document_number: '1234-5678-9012',
        document_front_url: 'https://images.unsplash.com/photo-1621360841013-c76831f12285?w=500&auto=format&fit=crop', // Fake ID card image
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

    // Create dummy PAN
    await prisma.kycDocument.upsert({
      where: {
        user_id_document_type: {
          user_id: latestInvestor.id,
          document_type: 'pan'
        }
      },
      update: {
        document_number: 'ABCDE1234F',
        document_front_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop', // Fake document image
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

    console.log('✅ Successfully seeded dummy KYC documents!');
  } catch (error) {
    console.error('Error seeding KYC:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedKyc();
