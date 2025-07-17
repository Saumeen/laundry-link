import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};



// Debug Firebase configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  // Debug configuration status without logging sensitive data
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    console.error('Please check your .env.local file and ensure all Firebase environment variables are set.');
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }

  // Additional validation for common issues
  if (firebaseConfig.authDomain && !firebaseConfig.authDomain.includes('.firebaseapp.com')) {
    console.warn('Warning: authDomain should end with .firebaseapp.com');
  }

  if (firebaseConfig.projectId && firebaseConfig.projectId.length < 6) {
    console.warn('Warning: projectId seems too short');
  }
};

// ✅ SAFE INITIALIZE TO AVOID DUPLICATE APP
let app;
let auth: Auth;

try {
  validateFirebaseConfig();
  
  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  
  auth = getAuth(app);
  
  // Enable persistence for better user experience
  setPersistence(auth, browserLocalPersistence);
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Please check:');
  console.error('1. Your .env.local file has all required Firebase variables');
  console.error('2. Firebase project is properly configured');
  console.error('3. Phone authentication is enabled in Firebase Console');
  console.error('4. reCAPTCHA is configured for your domain');
  throw error;
}

export { auth, app };
