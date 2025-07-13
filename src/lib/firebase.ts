import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

const firebaseConfig = {
  apiKey: "AIzaSyDk3iMuMAUaxtRuHL3nEJLPIwtRbohd9uQ",
  authDomain: "laundry-link-v1.firebaseapp.com",
  projectId: "laundry-link-v1",
  storageBucket: "laundry-link-v1.firebasestorage.app",
  messagingSenderId: "914052424697",
  appId: "1:914052424697:web:5375c6b8f53c22fde19328",
  measurementId: "G-SN7ZBHDTDH"
};


// Debug Firebase configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
    authDomain: firebaseConfig.authDomain ? 'Set' : 'Missing',
    projectId: firebaseConfig.projectId ? 'Set' : 'Missing',
    storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Missing',
    appId: firebaseConfig.appId ? 'Set' : 'Missing',
  });
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
    console.log('Using existing Firebase app');
    app = getApp();
  } else {
    console.log('Initializing new Firebase app');
    app = initializeApp(firebaseConfig);
  }
  
  auth = getAuth(app);
  
 
  
  console.log('Firebase initialized successfully');
  console.log('Firebase Auth Domain:', firebaseConfig.authDomain);
  console.log('Firebase Project ID:', firebaseConfig.projectId);
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
