import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin with environment variables
function getFirestoreClient() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID || 'even-equinox-468010-n2',
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: privateKey,
    };
    
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getFirestore();
}

const db = getFirestoreClient();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { type, data } = request.body;
  console.log(`Received ${type} data:`, data);

  try {
    if (type === 'trend') {
      await setDoc(doc(db, 'trends', `trend_${data.rank}`), { ...data, updatedAt: serverTimestamp() });
    } else if (type === 'report') {
      await addDoc(collection(db, 'reports'), { ...data, timestamp: serverTimestamp() });
    } else if (type === 'agent') {
      await setDoc(doc(db, 'agents', `agent_${data.id}`), { ...data, lastActive: serverTimestamp() });
    } else if (type === 'tokenUsage') {
      await addDoc(collection(db, 'tokenUsage'), { ...data, timestamp: serverTimestamp() });
    }
    return response.status(200).json({ status: 'ok', message: 'Data synced to Firestore' });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ status: 'error', message: String(error) });
  }
}
