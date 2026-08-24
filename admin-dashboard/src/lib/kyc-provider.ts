/**
 * Surepass KYC Provider Adapter
 * 
 * Provider-agnostic KYC service. Currently uses Surepass APIs.
 * Swap the adapter functions to switch providers (Setu, Cashfree, etc.)
 * 
 * Sandbox: Works with test data when SUREPASS_API_TOKEN is a sandbox token.
 * Production: Same code, just swap the token for production.
 * 
 * API Docs: https://docs.surepass.io
 */

const SUREPASS_BASE_URL = process.env.SUREPASS_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
const SUREPASS_TOKEN = process.env.SUREPASS_API_TOKEN || '';

interface PanVerifyResponse {
  success: boolean;
  data?: {
    full_name: string;
    pan_number: string;
    category: string; // "Individual", "Company", etc.
    status: string;   // "VALID" or "INVALID"
  };
  error?: string;
}

interface AadhaarOtpInitResponse {
  success: boolean;
  data?: {
    client_id: string; // Use this to verify OTP in step 2
    message: string;
  };
  error?: string;
}

interface AadhaarOtpVerifyResponse {
  success: boolean;
  data?: {
    full_name: string;
    aadhaar_number: string; // Masked
    dob: string;
    gender: string;
    address: {
      house: string;
      street: string;
      landmark: string;
      loc: string;
      po: string;
      dist: string;
      state: string;
      country: string;
      zip: string;
    };
    photo_link?: string; // Base64 photo from UIDAI
  };
  error?: string;
}

// ═══════════════════════════════════════════
// PAN CARD VERIFICATION
// ═══════════════════════════════════════════
export async function verifyPan(panNumber: string): Promise<PanVerifyResponse> {
  try {
    const response = await fetch(`${SUREPASS_BASE_URL}/pan/pan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({ id_number: panNumber }),
    });

    const result = await response.json();

    if (result.success || result.status_code === 200) {
      return {
        success: true,
        data: {
          full_name: result.data?.full_name || '',
          pan_number: result.data?.pan_number || panNumber,
          category: result.data?.category || 'Individual',
          status: 'VALID',
        },
      };
    }

    return { success: false, error: result.message || 'PAN verification failed' };
  } catch (error: any) {
    console.error('[KYC] PAN verification error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ═══════════════════════════════════════════
// AADHAAR EKYC - STEP 1: Send OTP
// ═══════════════════════════════════════════
export async function sendAadhaarOtp(aadhaarNumber: string): Promise<AadhaarOtpInitResponse> {
  try {
    const response = await fetch(`${SUREPASS_BASE_URL}/aadhaar-v2/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({ id_number: aadhaarNumber }),
    });

    const result = await response.json();

    if (result.success || result.status_code === 200) {
      return {
        success: true,
        data: {
          client_id: result.data?.client_id || '',
          message: 'OTP sent to Aadhaar-linked mobile number',
        },
      };
    }

    return { success: false, error: result.message || 'Failed to send OTP' };
  } catch (error: any) {
    console.error('[KYC] Aadhaar OTP send error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ═══════════════════════════════════════════
// AADHAAR EKYC - STEP 2: Verify OTP
// ═══════════════════════════════════════════
export async function verifyAadhaarOtp(clientId: string, otp: string): Promise<AadhaarOtpVerifyResponse> {
  try {
    const response = await fetch(`${SUREPASS_BASE_URL}/aadhaar-v2/submit-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({ client_id: clientId, otp }),
    });

    const result = await response.json();

    if (result.success || result.status_code === 200) {
      return {
        success: true,
        data: {
          full_name: result.data?.full_name || '',
          aadhaar_number: result.data?.aadhaar_number || '',
          dob: result.data?.dob || '',
          gender: result.data?.gender || '',
          address: result.data?.address || {},
          photo_link: result.data?.photo_link,
        },
      };
    }

    return { success: false, error: result.message || 'OTP verification failed' };
  } catch (error: any) {
    console.error('[KYC] Aadhaar OTP verify error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}
