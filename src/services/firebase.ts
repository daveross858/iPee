// Firebase config and initialization
// 1. Install: npm install firebase
// 2. Replace the config below with your Firebase project credentials

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2FYUCvUWqioemkcK0xgKIrZJ-bbY6Eew",
  authDomain: "ipee-firebase.firebaseapp.com",
  projectId: "ipee-firebase",
  storageBucket: "ipee-firebase.firebasestorage.app",
  messagingSenderId: "883750588455",
  appId: "1:883750588455:web:b8bc32b41360c5ec37be02",
  measurementId: "G-89DGLGJ2P0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
