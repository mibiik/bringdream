import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0WqUpvz94uLCnXBoZUWo4CC-STkOY0uk",
  authDomain: "bring-7d519.firebaseapp.com",
  projectId: "bring-7d519",
  storageBucket: "bring-7d519.appspot.com",
  messagingSenderId: "925221267917",
  appId: "1:925221267917:web:7c7d3e950dd4dbe9ac7c84",
  measurementId: "G-1452MRRRWD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics conditionally to prevent issues in environments without browser support
const initializeAnalytics = async () => {
  try {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      return getAnalytics(app);
    }
    return null;
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
};

// Initialize analytics
const analytics = initializeAnalytics();

// Authentication functions
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Create composite indexes to fix the FirebaseError
export const createFirestoreIndexes = async () => {
  console.log("Firestore indexes should be created in the Firebase Console.");
  console.log("If you're seeing index errors, please follow the links in the error messages to create the required indexes.");
};

export { auth, db, storage };
