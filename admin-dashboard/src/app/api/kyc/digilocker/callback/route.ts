import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDigilockerAccessToken, fetchDigilockerProfile } from '@/lib/kyc-provider';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Base64 encoded JSON { userId }
    const error = searchParams.get('error');

    if (error) {
      // User likely denied access
      return NextResponse.redirect(new URL('/kyc-failed', request.url));
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 });
    }

    // Decode state
    let userId = '';
    let returnUrl = 'realshare://kyc-success';
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      userId = decodedState.userId;
      if (decodedState.returnUrl) returnUrl = decodedState.returnUrl;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Exchange code for access token
    const accessToken = await getDigilockerAccessToken(code);
    if (!accessToken) {
      return NextResponse.redirect(new URL('/kyc-failed', request.url));
    }

    // Fetch user profile & documents from DigiLocker
    const profile = await fetchDigilockerProfile(accessToken);
    if (!profile) {
      return NextResponse.redirect(new URL('/kyc-failed', request.url));
    }

    // Update KYC records in our database based on the fetched documents
    if (profile.aadhaar) {
      const existingAadhaar = await prisma.kycDocument.findFirst({
        where: { user_id: userId, document_type: 'aadhaar' },
      });

      if (existingAadhaar) {
        await prisma.kycDocument.update({
          where: { id: existingAadhaar.id },
          data: {
            document_number: profile.aadhaar,
            verification_status: 'verified',
            verified_at: new Date(),
          }
        });
      } else {
        await prisma.kycDocument.create({
          data: {
            user_id: userId,
            document_type: 'aadhaar',
            document_number: profile.aadhaar,
            document_front_url: '', // Assume DigiLocker provides data, not physical scans
            verification_status: 'verified',
            verified_at: new Date(),
          }
        });
      }
    }

    if (profile.pan) {
      const existingPan = await prisma.kycDocument.findFirst({
        where: { user_id: userId, document_type: 'pan' },
      });

      if (existingPan) {
        await prisma.kycDocument.update({
          where: { id: existingPan.id },
          data: {
            document_number: profile.pan.toUpperCase(),
            verification_status: 'verified',
            verified_at: new Date(),
          }
        });
      } else {
        await prisma.kycDocument.create({
          data: {
            user_id: userId,
            document_type: 'pan',
            document_number: profile.pan.toUpperCase(),
            document_front_url: '',
            verification_status: 'verified',
            verified_at: new Date(),
          }
        });
      }
    }

    // If both documents are verified, update user profile status
    const verifiedDocsCount = await prisma.kycDocument.count({
      where: { user_id: userId, verification_status: 'verified' }
    });

    if (verifiedDocsCount >= 2) {
      await prisma.profile.update({
        where: { id: userId },
        data: { kyc_status: 'verified' }
      });
    }

    // Deep link back to the Expo app
    // In production, you would redirect to the custom URL scheme of your mobile app, e.g., realshare://kyc-success
    // Since this is typically opened in an in-app browser or Safari View Controller, we can just redirect to a success page
    // which the mobile app can listen for via URL changes.
    
    // We'll return a simple success HTML page that the mobile app can detect or the user can close.
    return new NextResponse(`
      <html>
        <head>
          <title>KYC Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1>KYC Verification Successful</h1>
          <p>Your documents have been securely verified via DigiLocker.</p>
          <p>You can now close this window and return to the app.</p>
          <script>
            // Try to deep link back to app if possible
            setTimeout(() => {
              window.location.href = '${returnUrl}';
            }, 2000);
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error: any) {
    console.error('[KYC] DigiLocker Callback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
