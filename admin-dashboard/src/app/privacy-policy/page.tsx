import React from 'react';

export const metadata = {
  title: 'Privacy Policy | RealShare',
  description: 'Privacy Policy for RealShare mobile application and web platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1E293B', lineHeight: '1.7' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#64748B', marginBottom: '24px' }}>Last updated: September 7, 2026</p>

      <p>
        RealShare Properties Pvt. Ltd. (&quot;RealShare&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting the personal data of users who use our mobile application and web services.
      </p>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '12px' }}>1. Information We Collect</h2>
      <p>We may collect personal identification information including but not limited to:</p>
      <ul>
        <li>Name, email address, and phone number when registering or booking site visits.</li>
        <li>Location data (approximate) to display relevant property listings in your city.</li>
        <li>Financial & KYC information if you apply for fractional real estate investments or property bookings.</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '12px' }}>2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Facilitate real estate project discovery, site visit scheduling, and developer consultations.</li>
        <li>Process KYC and investment documentation in accordance with Indian regulatory guidelines.</li>
        <li>Provide customer support and critical account notifications.</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '12px' }}>3. Data Security & Third-Party Sharing</h2>
      <p>
        We do not sell your personal data. We only share information with trusted third-party service providers (such as cloud hosting, Firebase authentication, and payment gateways) necessary to deliver our services, under strict confidentiality terms.
      </p>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '12px' }}>4. Account & Data Deletion</h2>
      <p>
        Users can request deletion of their account and associated personal data at any time by contacting our support team at <a href="mailto:support@realshare.in" style={{ color: '#2563EB' }}>support@realshare.in</a> or through the in-app support portal.
      </p>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '12px' }}>5. Contact Us</h2>
      <p>
        If you have questions regarding this Privacy Policy, please contact us at:<br />
        <strong>Email:</strong> support@realshare.in<br />
        <strong>Website:</strong> https://realshare.in
      </p>
    </div>
  );
}
