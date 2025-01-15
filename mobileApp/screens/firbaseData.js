// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZbywMA332ah2AfYZnbyiE-_mHD9dQotw",
  authDomain: "sugarmonitor-c315a.firebaseapp.com",
  projectId: "sugarmonitor-c315a",
  storageBucket: "sugarmonitor-c315a.firebasestorage.app",
  messagingSenderId: "297129706024",
  appId: "1:297129706024:web:ed3a45ddea9246904e2b1d",
  measurementId: "G-DY5P42MJTK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
