import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
      apiKey: "AIzaSyDVO-x7wATkpws9fgWrKNgqljqQzhpvYek",
      authDomain: "gridrr-storage.firebaseapp.com",
      projectId: "gridrr-storage",
      storageBucket: "gridrr-storage.firebasestorage.app",
      messagingSenderId: "478921294080",
      appId: "1:478921294080:web:e12aa4e9bfc8ba3aff73e5",
      measurementId: "G-3JND2GP4LW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
