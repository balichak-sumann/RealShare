import React from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

// Web-only. Drafted as a real, substantive starting point reflecting the
// platform's actual mechanics (fractional ownership, Razorpay payments,
// KYC) — not filler text. Still a draft: have counsel review before
// treating it as final or legally binding.
export default function TermsOfServiceScreen() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }

  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="September 2026"
      intro="These Terms of Service ('Terms') govern your access to and use of the RealShare app and website, operated by RealShare Properties Pvt. Ltd. ('RealShare', 'we', 'us'). By creating an account or using RealShare, you agree to these Terms."
      sections={[
        {
          heading: '1. Eligibility',
          body: [
            'You must be at least 18 years old and legally capable of entering into binding financial agreements to use RealShare. You must complete identity verification (KYC), including PAN and, where applicable, DigiLocker-based Aadhaar verification, before making an investment.',
          ],
        },
        {
          heading: '2. What RealShare offers',
          body: [
            'RealShare operates a marketplace for fractional ownership of real estate: a group of investors jointly acquires an interest in a property, each holding a proportional share. RealShare, or its associated entities, may facilitate acquisition, property management, and eventual resale of these interests.',
            'RealShare is a technology and services platform. It is not a bank, a registered investment advisor, or a broker-dealer, and nothing on the platform constitutes personalized investment, legal, or tax advice.',
          ],
        },
        {
          heading: '3. Investment risk',
          body: [
            'Real estate investments carry risk, including the risk of loss of principal, illiquidity, and fluctuations in property value and rental income. Historical performance figures shown on the platform (including any stated appreciation ranges) are illustrative and not a guarantee of future results. You should independently assess whether an investment is suitable for you, and consult independent financial or legal advice if needed.',
            'Fractional ownership positions may be less liquid than publicly traded securities. While RealShare aims to support resale of your share, we do not guarantee a buyer will be found within any particular timeframe or at any particular price.',
          ],
        },
        {
          heading: '4. Payments',
          body: [
            'Payments on RealShare are processed through our payment partner, Razorpay. By making a payment, you agree to Razorpay’s applicable terms in addition to these Terms. All fees, minimum investment amounts, and payout schedules will be disclosed to you before you commit to a transaction.',
          ],
        },
        {
          heading: '5. Your account',
          body: [
            'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately if you suspect unauthorized access.',
          ],
        },
        {
          heading: '6. Acceptable use',
          body: [
            'You agree not to misuse the platform, including by providing false information during KYC, attempting to circumvent security measures, or using the platform for any unlawful purpose.',
          ],
        },
        {
          heading: '7. Referral and partner programs',
          body: [
            'If you participate in the RealShare Partner or referral program, commissions are earned and paid according to the program terms communicated to you at the time of enrollment, and are subject to change with notice.',
          ],
        },
        {
          heading: '8. Intellectual property',
          body: [
            'The RealShare name, logo, app, and website content are the property of RealShare Properties Pvt. Ltd. and may not be used without our written permission.',
          ],
        },
        {
          heading: '9. Limitation of liability',
          body: [
            'To the maximum extent permitted by law, RealShare is not liable for indirect, incidental, or consequential damages arising from your use of the platform, including losses related to the performance of any investment.',
          ],
        },
        {
          heading: '10. Termination',
          body: [
            'We may suspend or terminate your account if you violate these Terms or applicable law. You may close your account at any time, subject to the completion of any pending transactions and our regulatory record-keeping obligations.',
          ],
        },
        {
          heading: '11. Governing law',
          body: [
            'These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.',
          ],
        },
        {
          heading: '12. Changes to these Terms',
          body: [
            "We may update these Terms from time to time. We'll update the 'Last updated' date above when we do, and, for material changes, we'll take reasonable steps to notify you.",
          ],
        },
        {
          heading: '13. Contact us',
          body: [
            'RealShare Properties Pvt. Ltd.\n206, Panchsheel Complex, Nizampet\nHyderabad – 500090, Telangana, India\n+91 40 4010 1212',
          ],
        },
      ]}
    />
  );
}
