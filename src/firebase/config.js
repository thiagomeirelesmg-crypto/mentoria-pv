import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAzRwRDNaridUehAsfNEUri0PyU4z7S1yA",
  authDomain: "mentoria-pv.firebaseapp.com",
  projectId: "mentoria-pv",
  storageBucket: "mentoria-pv.firebasestorage.app",
  messagingSenderId: "676732020166",
  appId: "1:676732020166:web:0dd0804d8eba9775787ec7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;