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
      await db.collection('users').createIndex({ created_at: -1 });
      await db.collection('bookings').createIndex({ user_id: 1 });
      await db.collection('bookings').createIndex({ class_id: 1 });
      await db.collection('bookings').createIndex({ user_id: 1, class_id: 1, status: 1 });
      await db.collection('user_memberships').createIndex({ user_id: 1 });
      await db.collection('user_memberships').createIndex({ user_id: 1, status: 1 });
      await db.collection('user_memberships').createIndex({ status: 1, expiry_date: 1 });
      await db.collection('classes').createIndex({ date: 1, start_time: 1 });
      await db.collection('classes').createIndex({ sport_id: 1, date: 1 });
      await db.collection('games').createIndex({ date: 1, start_time: 1 });
      await db.collection('game_participants').createIndex({ game_id: 1, user_id: 1 });
      await db.collection('payments').createIndex({ user_id: 1, created_at: -1 });
      await db.collection('payments').createIndex({ created_at: -1 });
      await db.collection('child_profiles').createIndex({ parent_id: 1 });
      await db.collection('coaches').createIndex({ created_at: -1 });
      await db.collection('announcements').createIndex({ created_at: -1 });
      await db.collection('attendance').createIndex({ booking_id: 1 }, { unique: true });
      await db.collection('attendance').createIndex({ class_id: 1 });
      await db.collection('trial_leads').createIndex({ email: 1 });
      await db.collection('trial_leads').createIndex({ created_at: -1 });
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
