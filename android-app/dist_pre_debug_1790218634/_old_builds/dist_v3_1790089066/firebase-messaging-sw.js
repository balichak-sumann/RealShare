importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Default config if URL parameters are missing
const firebaseConfig = {
  apiKey: "AIzaSyCDUd5PLfeEi-cdRvJwEPh0omcxfby8obI",
  authDomain: "real-share-b7162.firebaseapp.com",
  projectId: "real-share-b7162",
  storageBucket: "real-share-b7162.firebasestorage.app",
  messagingSenderId: "135004726221",
  appId: "1:135004726221:web:a1c1dfbe32c9bf3a335a84"
};

// Only initialize if we have the config
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/favicon.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
