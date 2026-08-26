import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter based on environment config.
 * Supports Gmail SMTP for production use.
 */
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Sends a welcome email to a newly created employee.
 */
export async function sendWelcomeEmail({
  to,
  employeeName,
  html,
}: {
  to: string;
  employeeName: string;
  html: string;
}) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"RealShare Team" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `🎉 Welcome to RealShare, ${employeeName}! Your Account is Ready`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an investment confirmation email to the user.
 */
export async function sendInvestmentSuccessEmail({
  to,
  userName,
  propertyName,
  fractionsBought,
  certificateId,
  amount,
}: {
  to: string;
  userName: string;
  propertyName: string;
  fractionsBought: number;
  certificateId: string;
  amount: number;
}) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"RealShare Team" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `Investment Confirmed: ${propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #1A56DB;">Investment Successful! 🎉</h2>
        <p>Hi ${userName},</p>
        <p>Congratulations! Your investment in <strong>${propertyName}</strong> has been successfully processed.</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Transaction Details</h3>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Fractions Bought:</strong> ${fractionsBought}</p>
          <p><strong>Total Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
          <p><strong>Certificate ID:</strong> ${certificateId}</p>
        </div>
        
        <p>You can view your digital share certificate and track your portfolio performance anytime in the RealShare app.</p>
        <p>Thank you for investing with us!</p>
        <p>Best regards,<br/>The RealShare Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Investment success email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send investment email:', error.message);
    // Return true anyway so the API doesn't fail just because email failed
    return { success: false, error: error.message };
  }
}
