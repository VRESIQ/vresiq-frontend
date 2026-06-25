import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-for-local-testing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vresiq.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vresiq",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vresiq.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234:web:abcd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
};
