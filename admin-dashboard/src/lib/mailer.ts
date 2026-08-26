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
