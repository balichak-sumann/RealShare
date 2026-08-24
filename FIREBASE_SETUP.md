# Firebase Production Setup Guide

When deploying this project for the client, you must follow these exact steps to recreate the Firebase authentication environment and connect it to both the React Native mobile app and the Next.js backend.

## 1. Create the Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g., `RealShare-Production`).
3. (Optional) Enable Google Analytics if the client wants tracking.
4. Click **Create Project**.

## 2. Register the Web App (For Frontend Config)
1. On the Firebase Dashboard, click the **`</>` (Web)** icon to add a web app.
2. Give it a nickname (e.g., `RealShare App`) and click **Register app**.
3. Firebase will generate a `firebaseConfig` object. Keep this screen open.
4. In your `android-app/.env` file, map the values exactly like this:
```env
EXPO_PUBLIC_FIREBASE_API_KEY="your_api_key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
EXPO_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

## 3. Enable Authentication Providers
1. On the left sidebar, go to **Build** -> **Authentication**.
2. Click **Get Started**.
3. Go to the **Sign-in method** tab.
4. Click on **Email/Password**, toggle **Enable**, and click Save.
5. Click on **Phone**, toggle **Enable**, and click Save.

## 4. Unlock SMS Regions (For Phone OTPs)
1. Still inside Authentication, go to the **Settings** tab.
2. Click on **SMS region policy** in the left menu.
3. Select **Allow only to selected regions** and add the required countries (e.g., `India`), OR select **Allow sending to all regions**.
4. Click Save.

## 5. Upgrade to Blaze Plan (CRITICAL for SMS)
*Note: Firebase now strictly requires a billing account to send SMS messages to prevent spam.*
1. Look at the bottom left corner of the Firebase Console.
2. Click **Upgrade**.
3. Select the **Blaze (Pay as you go)** plan and link a credit card. (The first 10,000 SMS texts per month are still 100% free).

## 6. Generate Service Account Key (For Backend Database Sync)
*This is required for the Next.js backend to securely verify tokens and sync the user to the PostgreSQL database.*
1. Go to **Project Overview** (top left gear icon) -> **Project Settings**.
2. Click on the **Service accounts** tab.
3. Ensure "Node.js" is selected and click **Generate new private key**.
4. A JSON file will download. Open it.
5. In your `admin-dashboard/.env` file, map the values from the JSON like this:
```env
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_KEY_HERE\n-----END PRIVATE KEY-----\n"
```
*(Make sure the private key is wrapped in quotes so the `\n` line breaks are parsed correctly).*

## 7. Restart Servers
Once both `.env` files are populated, completely stop and restart both the Next.js backend (`npm run dev`) and the Expo mobile app (`npx expo start -c`) to lock in the production keys.
