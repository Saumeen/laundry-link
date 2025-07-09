import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-bWuU39I3Evg--AVm5jcRYboheSQlOjY",
  authDomain: "laundrylink-33ee0.firebaseapp.com",
  projectId: "laundrylink-33ee0",
  storageBucket: "laundrylink-33ee0.appspot.com",
  messagingSenderId: "149437762807",
  appId: "1:149437762807:web:9ea9d40f3614995d9997f2",
  measurementId: "G-NTLD2LRFZF",
};

// ✅ SAFE INITIALIZE TO AVOID DUPLICATE APP
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
