import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface ServiceInquiryDetails {
  customer_name: string;
  phone?: string | null;
  email?: string | null;
  service_type: string;
}

export async function sendServiceInquiryEmail(details: ServiceInquiryDetails) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not found. Email not sent.');
    return;
  }

  const mailOptions = {
    from: `"RealShare Concierge" <${process.env.SMTP_EMAIL}>`,
    to: process.env.SMTP_EMAIL, // Sending to the admin themselves
    subject: `New Service Request: ${details.service_type}`,
    html: `
      <div style="font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #cda858; margin: 0; font-size: 24px;">RealShare Concierge</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">New Home Service Request</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border-top: 4px solid #cda858; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1a1a1a; margin-top: 0; font-size: 18px; margin-bottom: 16px;">Request Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${details.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Phone Number:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${details.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Email Address:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${details.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;"><strong>Service Requested:</strong></td>
              <td style="padding: 10px 0; color: #cda858; font-weight: bold;">${details.service_type}</td>
            </tr>
          </table>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
          This is an automated message from your RealShare platform.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Service inquiry email sent for ${details.service_type}`);
  } catch (error) {
    console.error('Failed to send service inquiry email:', error);
    // We don't throw here so it doesn't crash the API route
  }
}
