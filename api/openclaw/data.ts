import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIRESTORE_PROJECT_ID = 'even-equinox-468010-n2';
const FIRESTORE_DB = 'ai-studio-778af185-5d3d-46e5-8e93-6047a75845ec';

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(v => toFirestoreValue(v)) }};
  if (typeof value === 'object') return { mapValue: { fields: toFirestoreFields(value) }};
  return { stringValue: String(value) };
}

function toFirestoreFields(obj: any): any {
  const fields: any = {};
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

async function createDocument(collection: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB}/documents/${collection}?documentId=${docId}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });
  
  if (!res.ok) {
    const err = await res.text();
    if (res.status === 409) {
      return createDocument(collection, `${docId}_${randomId()}`, data);
    }
    throw new Error(`Firestore error: ${res.status} - ${err}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { type, data } = req.body;
  console.log(`Received ${type} data:`, data);

  try {
    if (type === 'trend') {
      await createDocument('trends', `trend_${randomId()}`, { ...data, updatedAt: new Date().toISOString() });
    } else if (type === 'report') {
      await createDocument('reports', `report_${randomId()}`, { ...data, timestamp: new Date().toISOString() });
    } else if (type === 'agent') {
      await createDocument('agents', `agent_${randomId()}`, { ...data, lastActive: new Date().toISOString() });
    } else if (type === 'tokenUsage') {
      await createDocument('tokenUsage', `usage_${randomId()}`, { ...data, timestamp: new Date().toISOString() });
    } else if (type === 'instreet') {
      await createDocument('instreet', `instreet_${randomId()}`, { ...data, timestamp: new Date().toISOString() });
    }
    
    return res.status(200).json({ status: 'ok', message: 'Data synced to Firestore' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ status: 'error', message: String(error) });
  }
}
