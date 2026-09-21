/**
 * SMSGatewayHub integration for sending OTP SMS messages.
 *
 * Reads credentials from environment variables:
 *   SMSGATEWAYHUB_API_KEY, SMSGATEWAYHUB_SENDER_ID,
 *   SMSGATEWAYHUB_ENTITY_ID, SMSGATEWAYHUB_DLT_TEMPLATE_ID,
 *   SMSGATEWAYHUB_LOGIN_DLT_TEMPLATE_ID
 */

const SMSGATEWAYHUB_ENDPOINT = 'https://www.smsgatewayhub.com/api/mt/SendSMS';

interface SmsConfig {
  templateId: string;
  message: string;
}

function getSmsConfig(otp: string, isLogin: boolean): SmsConfig {
  if (isLogin && process.env.SMSGATEWAYHUB_LOGIN_DLT_TEMPLATE_ID) {
    const templateText = process.env.SMSGATEWAYHUB_LOGIN_TEMPLATE_TEXT || 'Your OTP for login to Realshare is {#var#}. This OTP is valid for 10 minutes. Please do not share it with anyone.';
    return {
      templateId: process.env.SMSGATEWAYHUB_LOGIN_DLT_TEMPLATE_ID,
      message: templateText.replace('{#var#}', otp),
    };
  }
  // Registration template (also used as fallback when login template is unavailable)
  const templateText = process.env.SMSGATEWAYHUB_DLT_TEMPLATE_TEXT || 'Your Realshare Properties OTP to register your account is: {#var#}. Please do not share with anyone.';
  return {
    templateId: process.env.SMSGATEWAYHUB_DLT_TEMPLATE_ID!,
    message: templateText.replace('{#var#}', otp),
  };
}

async function attemptSend(
  apiKey: string,
  senderId: string,
  entityId: string,
  phone: string,
  config: SmsConfig
): Promise<{ success: boolean; error?: string }> {
  const url = new URL(SMSGATEWAYHUB_ENDPOINT);
  url.searchParams.set('APIKey', apiKey);
  url.searchParams.set('senderid', senderId);
  url.searchParams.set('channel', '2'); // Transactional channel
  url.searchParams.set('DCS', '0');
  url.searchParams.set('flashsms', '0');
  url.searchParams.set('number', `91${phone}`); // Indian numbers with country code
  url.searchParams.set('text', config.message);
  url.searchParams.set('EntityId', entityId);
  url.searchParams.set('dlttemplateid', config.templateId);

  const response = await fetch(url.toString());
  const data = await response.json();

  console.log('[SMS] SMSGatewayHub response:', JSON.stringify(data));

  // SMSGatewayHub returns ErrorCode "000" for success
  if (data?.ErrorCode === '000' || data?.ErrorMessage?.toLowerCase()?.includes('success')) {
    return { success: true };
  }

  return { success: false, error: data?.ErrorMessage || 'SMS delivery failed' };
}

export async function sendOtpSms(phone: string, otp: string, isLogin: boolean = false): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SMSGATEWAYHUB_API_KEY;
  const senderId = process.env.SMSGATEWAYHUB_SENDER_ID;
  const entityId = process.env.SMSGATEWAYHUB_ENTITY_ID;
  const registrationTemplateId = process.env.SMSGATEWAYHUB_DLT_TEMPLATE_ID;

  if (!apiKey || apiKey === 'your_smsgatewayhub_api_key' || !senderId || !entityId || entityId === 'your_dlt_entity_id' || !registrationTemplateId || registrationTemplateId === 'your_dlt_template_id') {
    console.warn(`\n[SMS MOCK] Missing SMS credentials. Mocking SMS delivery.\n[SMS MOCK] Sent to: ${phone}\n[SMS MOCK] OTP IS: ${otp}\n[SMS MOCK] Context: ${isLogin ? 'Login' : 'Registration'}\n`);
    return { success: true };
  }

  const primaryConfig = getSmsConfig(otp, isLogin);

  try {
    const result = await attemptSend(apiKey, senderId, entityId, phone, primaryConfig);

    // If login template fails (e.g. not yet synced with SMSGatewayHub), 
    // fall back to the registration template so the OTP still gets delivered.
    if (!result.success && isLogin) {
      console.warn(`[SMS] Login template failed (${result.error}). Falling back to registration template.`);
      const fallbackConfig = getSmsConfig(otp, false);
      return await attemptSend(apiKey, senderId, entityId, phone, fallbackConfig);
    }

    return result;
  } catch (err: any) {
    console.error('[SMS] Failed to send OTP:', err?.message);

    // Last-resort fallback for login attempts
    if (isLogin) {
      try {
        console.warn('[SMS] Retrying with registration template after network error.');
        const fallbackConfig = getSmsConfig(otp, false);
        return await attemptSend(apiKey, senderId, entityId, phone, fallbackConfig);
      } catch (fallbackErr: any) {
        console.error('[SMS] Fallback also failed:', fallbackErr?.message);
      }
    }

    return { success: false, error: 'Failed to connect to SMS service' };
  }
}
