import React from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

// Web-only. Drafted as a real, substantive policy reflecting how the app
// actually works (Firebase auth, Razorpay payments, DigiLocker/PAN KYC) —
// not filler text. Still a draft: have counsel review before treating it as
// final or legally binding.
export default function PrivacyPolicyScreen() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }

  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="September 2026"
      intro="RealShare Properties Pvt. Ltd. ('RealShare', 'we', 'us') respects your privacy. This policy explains what personal information we collect through our app and website, how we use it, and the choices you have."
      sections={[
        {
          heading: '1. Information we collect',
          body: [
            'Account information: your name, phone number, email address, and password or authentication credentials, collected when you sign up or sign in (via Firebase Authentication).',
            'Identity verification (KYC) information: PAN details and, where you choose to complete DigiLocker-based verification, Aadhaar-linked identity data, collected to meet regulatory know-your-customer requirements for real estate investment.',
            'Financial and transaction information: bank account details you provide for payouts, and payment and transaction records processed through our payment partner, Razorpay. We do not store your card or UPI credentials ourselves.',
            'Investment and property information: the properties, fractions, and investments associated with your account, and documents you upload (such as agreements or supporting files).',
            'Usage information: how you interact with the app and website, device and log information, and, on the web, standard browser information.',
          ],
        },
        {
          heading: '2. How we use your information',
          body: [
            'To create and manage your account, verify your identity, and provide customer support.',
            'To process investments, payouts, and other transactions you initiate, and to maintain accurate records of your fractional ownership.',
            'To communicate with you about your account, investments, support tickets, and service updates.',
            'To meet legal, regulatory, and compliance obligations applicable to real estate and financial services in India.',
            'To improve the reliability, security, and usability of our app and website.',
          ],
        },
        {
          heading: '3. How we share your information',
          body: [
            'With service providers who help us operate the platform, including Firebase (authentication and infrastructure), Razorpay (payment processing), and DigiLocker (identity verification) — each of these providers processes data under their own privacy and security terms.',
            'With property developers, agents, or partners directly involved in a transaction you undertake, to the extent needed to complete that transaction.',
            'With regulators, law enforcement, or courts where required by law.',
            'We do not sell your personal information to third parties.',
          ],
        },
        {
          heading: '4. Data retention',
          body: [
            'We retain your account and transaction information for as long as your account is active and for a reasonable period afterward, as needed to meet legal, accounting, tax, and regulatory record-keeping requirements applicable to financial and real estate transactions.',
          ],
        },
        {
          heading: '5. Your rights',
          body: [
            'You can access and update most of your account information directly from the Profile section of the app.',
            'You may request access to, correction of, or deletion of your personal information, subject to our legal and regulatory obligations to retain certain records (for example, KYC and transaction records).',
            'To make a request, contact us using the details below.',
          ],
        },
        {
          heading: '6. Security',
          body: [
            'We use industry-standard measures, including encrypted authentication and secure payment processing through our partners, to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
          ],
        },
        {
          heading: '7. Children',
          body: [
            'RealShare is intended for adults capable of entering into binding financial agreements. We do not knowingly collect personal information from anyone under 18.',
          ],
        },
        {
          heading: '8. Changes to this policy',
          body: [
            "We may update this policy from time to time. We'll update the 'Last updated' date above when we do, and, for material changes, we'll take reasonable steps to notify you.",
          ],
        },
        {
          heading: '9. Contact us',
          body: [
            'RealShare Properties Pvt. Ltd.\n206, Panchsheel Complex, Nizampet\nHyderabad – 500090, Telangana, India\n+91 40 4010 1212',
          ],
        },
      ]}
    />
  );
}
