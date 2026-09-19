async function main() {
  console.log("Fetching /api/otp/send...");
  try {
    const phoneRes = await fetch('https://admin.realshare.in/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '6302662448' })
    });
    const phoneText = await phoneRes.text();
    console.log("Phone Route:", phoneRes.status, phoneText);
    
    console.log("Fetching /api/otp/send-email...");
    const emailRes = await fetch('https://admin.realshare.in/api/otp/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'balichaksumann@gmail.com' })
    });
    const emailText = await emailRes.text();
    console.log("Email Route:", emailRes.status, emailText);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}
main();
