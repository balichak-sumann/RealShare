import { NextResponse } from 'next/server';
import { getDigilockerAuthUrl } from '@/lib/kyc-provider';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token parameter' }, { status: 401 });
    }

    const returnUrl = searchParams.get('return_url') || 'realshare://kyc-success';

    let userId = 'mock-user-123';
    if (token !== 'MOCK_TOKEN') {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    }

    // Embed return_url into the state so the callback knows where to redirect
    const state = encodeURIComponent(Buffer.from(JSON.stringify({ userId, returnUrl })).toString('base64'));
    const authUrl = `${process.env.DIGILOCKER_AUTH_URL || 'https://api.digitallocker.gov.in/public/oauth2/1/authorize'}?response_type=code&client_id=${process.env.DIGILOCKER_CLIENT_ID || 'mock_client_id'}&redirect_uri=${encodeURIComponent(process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:3000/api/kyc/digilocker/callback')}&state=${state}`;
    
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[KYC] DigiLocker Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
