/**
 * SMSGatewayHub integration for sending OTP SMS messages.
 *
 * Reads credentials from environment variables:
 *   SMSGATEWAYHUB_API_KEY, SMSGATEWAYHUB_SENDER_ID,
 *   SMSGATEWAYHUB_ENTITY_ID, SMSGATEWAYHUB_DLT_TEMPLATE_ID
 */

const SMSGATEWAYHUB_ENDPOINT = 'https://www.smsgatewayhub.com/api/mt/SendSMS';

export async function sendOtpSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SMSGATEWAYHUB_API_KEY;
  const senderId = process.env.SMSGATEWAYHUB_SENDER_ID;
  const entityId = process.env.SMSGATEWAYHUB_ENTITY_ID;
  const templateId = process.env.SMSGATEWAYHUB_DLT_TEMPLATE_ID;

  if (!apiKey || apiKey === 'your_smsgatewayhub_api_key' || !senderId || !entityId || entityId === 'your_dlt_entity_id' || !templateId || templateId === 'your_dlt_template_id') {
    console.warn(`\n[SMS MOCK] Missing SMS credentials. Mocking SMS delivery.\n[SMS MOCK] Sent to: ${phone}\n[SMS MOCK] OTP IS: ${otp}\n`);
    return { success: true };
  }

  // The message text MUST match the DLT-approved template exactly.
  // Approved Jio DLT Template ID: 1207175454269228947
  const message = `Your Realshare Properties OTP to register your account is: ${otp}. Please do not share with anyone.`;

  const url = new URL(SMSGATEWAYHUB_ENDPOINT);
  url.searchParams.set('APIKey', apiKey);
  url.searchParams.set('senderid', senderId);
  url.searchParams.set('channel', '2'); // Transactional channel
  url.searchParams.set('DCS', '0');
  url.searchParams.set('flashsms', '0');
  url.searchParams.set('number', `91${phone}`); // Indian numbers with country code
  url.searchParams.set('text', message);
  url.searchParams.set('EntityId', entityId);
  url.searchParams.set('dlttemplateid', templateId);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('[SMS] SMSGatewayHub response:', JSON.stringify(data));

    // SMSGatewayHub returns ErrorCode "000" for success
    if (data?.ErrorCode === '000' || data?.ErrorMessage?.toLowerCase()?.includes('success')) {
      return { success: true };
    }

    return { success: false, error: data?.ErrorMessage || 'SMS delivery failed' };
  } catch (err: any) {
    console.error('[SMS] Failed to send OTP:', err?.message);
    return { success: false, error: 'Failed to connect to SMS service' };
  }
}
