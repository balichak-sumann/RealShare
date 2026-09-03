import { Redirect } from 'expo-router';

// This route collided with the tab bar's own /profile screen under (tabs) —
// Expo Router resolves both to the same URL, so this file was effectively
// dead code and its "Saved Searches"/"Payment History" links pointed at
// routes that don't exist anywhere in the app. Redirecting keeps any old
// link/deep-link to /profile working without the broken duplicate UI.
export default function ProfileRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
