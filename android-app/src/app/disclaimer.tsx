import React from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export default function DisclaimerScreen() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }

  return (
    <LegalPageLayout
      title="Disclaimer"
      intro="Thank you for visiting www.realshare.in"
      sections={[
        {
          heading: 'Platform Intermediary Role',
          body: [
            'Realshare Properties Private Limited (Realshare) is only an intermediary offering its platform to advertise properties of Seller for a Customer/Buyer/User coming on its website and is not and cannot be a party to or privy to or control in any manner any transactions between the Seller and the Customer/Buyer/User.',
            'All the offers and discounts on this Website have been extended by various Builder(s)/Developer(s) who have advertised their products. Realshare is only communicating the offers and not selling or rendering any of those products or services.',
            'It neither warrants nor is it making any representations with respect to offer(s) made on the site. Realshare Properties Private Limited shall neither be responsible nor liable to mediate or resolve any disputes or disagreements between the Customer/Buyer/User and the Seller and both Seller and Customer/Buyer/User shall settle all such disputes without involving Realshare Properties Private Limited in any manner.'
          ],
        },
        {
          heading: 'Information Accuracy & Updates',
          body: [
            'This Web site may contain other proprietary notices and copyright information, the terms of which must be observed and followed. Information may be changed or updated without notice. Realshare might also make changes and/or improvements in the products and/or the programs described in this information at any time without notice.',
            'By accessing this website any further, you confirm that the information including images, details, brochures and all other marketing materials etc. on this website is solely for the purpose of information only.',
            'All information is subject to change and you are, hereby, advised not to base your decision on any or all the information provided through this website. All information on this website is subject to change and you should not rely on this information for making any bookings/purchase in any of the projects.',
            'All information provided here does not constitute advertising, marketing, booking, selling or an offer for sale or invitation to purchase a unit in any of the projects displayed on the website by Realshare Properties Pvt. Ltd. Realshare is not liable for any consequences of any actions taken by relying solely on such material/information as shown on this website.'
          ],
        },
        {
          heading: 'Bookings & Liabilities',
          body: [
            'Queries/feedback/etc. are not monitored on the website, therefore shall not be construed as read or registered with the owner of the website.',
            'Realshare will not be accepting any bookings or allotments based on the images, material, stock photography, projections, details, descriptions that are currently available and/or displayed on the website.',
            'Under no circumstances, Realshare will be responsible or liable for any claims made by anyone claiming to be users including seeking any cancellations for any inaccuracies or deviations as mentioned in the website, though all efforts are made to ensure and provide enough information.',
            'Realshare will not be responsible for any expense, loss or damage without limitation, indirect or consequential loss or damage whatsoever arising from the use, or loss of use, of data arising out of or in connection with the use of this website.'
          ],
        },
        {
          heading: 'Contact Us',
          body: [
            'Please contact our sales team at +91.40.40101212 for latest updated sales or other marketing information.',
            'We thank you for your patience and understanding.'
          ],
        }
      ]}
    />
  );
}
