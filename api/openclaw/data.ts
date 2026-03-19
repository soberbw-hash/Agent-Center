import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIRESTORE_PROJECT_ID = 'even-equinox-468010-n2';
const FIRESTORE_DB = 'ai-studio-778af185-5d3d-46e5-8e93-6047a75845ec';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB}/documents`;

async function firestoreRequest(collection: string, docId: string, data: any, method: 'create' | 'update' = 'create') {
  const url = `${FIRESTORE_URL}/${collection}/${docId}?updateMask.fieldPaths=*`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: convertToFirestoreFields(data)
    })
  });
  
  return response.json();
}

function convertToFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: String(value) };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => convertToFirestoreFields({ v }).fields.v) } };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: convertToFirestoreFields(value) };
    }
  }
  return fields;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { type, data } = request.body;
  console.log(`Received ${type} data:`, data);

  try {
    if (type === 'trend') {
      await firestoreRequest('trends', `trend_${data.rank}`, { ...data, updatedAt: { timestampValue: new Date().toISOString() } });
    } else if (type === 'report') {
      await firestoreRequest('reports', `report_${Date.now()}`, { ...data, timestamp: { timestampValue: new Date().toISOString() } });
    } else if (type === 'agent') {
      await firestoreRequest('agents', `agent_${data.id}`, { ...data, lastActive: { timestampValue: new Date().toISOString() } });
    } else if (type === 'tokenUsage') {
      await firestoreRequest('tokenUsage', `usage_${Date.now()}`, { ...data, timestamp: { timestampValue: new Date().toISOString() } });
    }
    
    return response.status(200).json({ status: 'ok', message: 'Data synced to Firestore' });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ status: 'error', message: String(error) });
  }
}
