// Firebase configuration
// RealEarn App - User Configuration

export const firebaseConfig = {
  apiKey: "AIzaSyCvhGuyx6ZSrimCjk2G2Q9pdoihvjb3Hms",
  authDomain: "realearn-app.firebaseapp.com",
  databaseURL: "https://realearn-app-default-rtdb.firebaseio.com",
  projectId: "realearn-app",
  storageBucket: "realearn-app.firebasestorage.app",
  messagingSenderId: "241034846565",
  appId: "1:241034846565:web:26f6da801689f429f9018c",
  measurementId: "G-WPH8TW221C"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;