import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

// Firebase web config 可以放在前端，但 Firestore rules 必須限制寫入格式。
// 目前為專題展示用途，Firestore rules 需限制寫入格式，避免被濫用。
const hasFirebaseConfig = !Object.values(firebaseConfig).some((value) => value.startsWith('YOUR_'));
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const collectionName = 'body_shape_votes';

export function isFirebaseReady() {
  return Boolean(db);
}

export async function addBodyShapeVote({ gender, optionId }) {
  if (!db) {
    throw new Error('Firebase config is not set.');
  }

  await addDoc(collection(db, collectionName), {
    gender,
    optionId,
    createdAt: serverTimestamp()
  });
}

export function listenBodyShapeVotes(onVotesChange, onError) {
  if (!db) {
    onVotesChange([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const votes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onVotesChange(votes);
    },
    onError
  );
}
