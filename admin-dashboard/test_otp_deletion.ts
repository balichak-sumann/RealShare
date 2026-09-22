import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Authorization': 'Bearer TEST_SUPERADMIN_TOKEN',
  'Content-Type': 'application/json'
};

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function testOtpDeletion() {
  console.log('--- STARTING OTP DELETION TEST ---');
  
  // 1. Create a dummy banner to delete
  const dummyBanner = await prisma.banner.create({
    data: {
      title: 'TEST_BANNER_OTP',
      image_url: 'https://example.com/test.jpg',
      placement: 'home_top',
      is_active: true
    }
  });
  console.log(`[1] Created dummy banner for testing. ID: ${dummyBanner.id}`);

  try {
    // 2. Attempt deletion WITHOUT OTP
    console.log('\n[2] Attempting to delete without OTP...');
    let res = await fetch(`${BASE_URL}/api/cms/banners/${dummyBanner.id}`, {
      method: 'DELETE',
      headers: HEADERS
    });
    let data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    if (res.status === 400 && data.error.includes('OTP is required')) {
      console.log('✅ Correctly rejected: OTP is required.');
    } else {
      console.log('❌ Failed: Expected 400 OTP Required.');
    }

    // 3. Request an OTP
    console.log('\n[3] Requesting Deletion OTP...');
    res = await fetch(`${BASE_URL}/api/admin/deletion-otp`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ targetId: dummyBanner.id, targetType: 'Banner' })
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    
    // In test environment, the backend will return devOtp, or we can just use the mock '123456'
    const otpToUse = '123456';
    console.log(`✅ OTP Dispatch requested. Will use bypass OTP: ${otpToUse}`);

    // 4. Attempt deletion with WRONG OTP
    console.log('\n[4] Attempting to delete with WRONG OTP (000000)...');
    res = await fetch(`${BASE_URL}/api/cms/banners/${dummyBanner.id}?otp=000000`, {
      method: 'DELETE',
      headers: HEADERS
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    if (res.status === 400 && data.error.includes('Incorrect OTP')) {
      console.log('✅ Correctly rejected: Incorrect OTP.');
    } else {
      console.log('❌ Failed: Expected 400 Incorrect OTP.');
    }

    // 5. Attempt deletion with CORRECT OTP
    console.log(`\n[5] Attempting to delete with CORRECT OTP (${otpToUse})...`);
    res = await fetch(`${BASE_URL}/api/cms/banners/${dummyBanner.id}?otp=${otpToUse}`, {
      method: 'DELETE',
      headers: HEADERS
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    if (res.status === 200 && data.success) {
      console.log('✅ Correctly deleted with valid OTP.');
    } else {
      console.log('❌ Failed: Expected 200 Success.');
    }

    // Verify it's actually deleted from DB
    const checkDeleted = await prisma.banner.findUnique({ where: { id: dummyBanner.id } });
    if (!checkDeleted) {
      console.log('\n✅ Verified: Record is completely removed from database.');
    } else {
      console.log('\n❌ Failed: Record still exists in database!');
    }

  } catch (error) {
    console.error('Test script encountered an error:', error);
  } finally {
    // Cleanup just in case the test failed halfway
    try {
      await prisma.banner.delete({ where: { id: dummyBanner.id } });
      console.log('Cleaned up dummy banner.');
    } catch(e) {}
    await prisma.$disconnect();
  }
}

testOtpDeletion();
