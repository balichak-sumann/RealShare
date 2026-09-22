const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Authorization': 'Bearer TEST_SUPERADMIN_TOKEN',
  'Content-Type': 'application/json'
};

async function testOtpDeletion() {
  console.log('--- STARTING OTP DELETION TEST ---');
  
  const dummyId = 'dummy_banner_id_123';
  console.log(`[1] Testing with target ID: ${dummyId}`);

  try {
    // 2. Attempt deletion WITHOUT OTP
    console.log('\n[2] Attempting to delete without OTP...');
    let res = await fetch(`${BASE_URL}/api/cms/banners/${dummyId}`, {
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
      body: JSON.stringify({ targetId: dummyId, targetType: 'Banner' })
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    
    // In test environment, the backend will return devOtp, or we can just use the mock '123456'
    const otpToUse = '123456';
    console.log(`✅ OTP Dispatch requested. Will use bypass OTP: ${otpToUse}`);

    // 4. Attempt deletion with WRONG OTP
    console.log('\n[4] Attempting to delete with WRONG OTP (000000)...');
    res = await fetch(`${BASE_URL}/api/cms/banners/${dummyId}?otp=000000`, {
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
    res = await fetch(`${BASE_URL}/api/cms/banners/${dummyId}?otp=${otpToUse}`, {
      method: 'DELETE',
      headers: HEADERS
    });
    
    // Note: Since the dummy banner doesn't exist in the DB, Prisma will throw a RecordNotFound error when it tries to delete it.
    // However, this means it SUCCESSFULLY passed the OTP check!
    data = await res.json().catch(() => ({}));
    console.log(`Status: ${res.status}, Response:`, data);
    
    if (res.status === 500 && data.error && (data.error.includes('Record to delete does not exist') || data.error.includes('Failed to delete'))) {
      console.log('✅ Correctly bypassed OTP check and reached database layer (failed to find dummy record, which is expected).');
    } else if (res.status === 200) {
      console.log('✅ Correctly deleted with valid OTP.');
    } else {
      console.log('❌ Failed: Unexpected response.');
    }

  } catch (error) {
    console.error('Test script encountered an error:', error);
  }
}

testOtpDeletion();
