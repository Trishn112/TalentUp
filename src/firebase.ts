import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnT8cOrUl2mKtg2lmP1CZw6sH5dqr7oa0",
  authDomain: "talentup-6211d.firebaseapp.com",
  projectId: "talentup-6211d",
  storageBucket: "talentup-6211d.firebasestorage.app",
  messagingSenderId: "946327382919",
  appId: "1:946327382919:web:0169cbafbe9ea224004122",
  measurementId: "",
};

const FIRESTORE_DATABASE_ID = "(default)";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signOut = () => firebaseSignOut(auth);