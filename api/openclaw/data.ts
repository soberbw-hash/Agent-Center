import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
  initializeApp({ credential: cert(firebaseConfig) });
}

const db = getFirestore();

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
    return response.status(500).json({ status: 'error', message: 'Failed to sync' });
  }
}
