import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc
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
const bodyChoiceStatsCollection = 'bodyChoiceStats';

export function isFirebaseReady() {
  return Boolean(db);
}

export async function addBodyShapeVote({ gender, optionId }) {
  if (!db) {
    console.warn('Firebase config missing, skip saving.');
    return;
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

export async function saveBodyChoiceStat({
  clientId,
  choiceId,
  bodyFatRange,
  bodyFatMin,
  bodyFatMax,
  gender
}) {
  if (!db) {
    console.warn('Firebase config missing, skip saving.');
    return;
  }

  await setDoc(doc(db, bodyChoiceStatsCollection, clientId), {
    clientId,
    choiceId,
    bodyFatRange,
    bodyFatMin,
    bodyFatMax,
    gender,
    updatedAt: serverTimestamp()
  });
}

export function listenBodyChoiceStats(onStatsChange, onError) {
  if (!db) {
    onStatsChange([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, bodyChoiceStatsCollection),
    (snapshot) => {
      const stats = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      onStatsChange(stats);
    },
    onError
  );
}
