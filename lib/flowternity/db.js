import { MongoClient } from 'mongodb';

let clientPromise = null;
let indexesCreated = false;

async function _connect() {
  const c = new MongoClient(process.env.MONGO_URL);
  await c.connect();
  return c;
}

export async function getDb() {
  if (!clientPromise) clientPromise = _connect();
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  if (!indexesCreated) {
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('bookings').createIndex({ user_id: 1 });
      await db.collection('bookings').createIndex({ class_id: 1 });
      indexesCreated = true;
    } catch (e) {
      // Non-fatal
      console.warn('index creation warning:', e.message);
    }
  }
  return db;
}

export const clean = (doc) => {
  if (!doc) return doc;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};
