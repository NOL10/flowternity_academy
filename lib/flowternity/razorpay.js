import Razorpay from 'razorpay';
import crypto from 'crypto';

let _instance = null;
export function getRazorpay() {
  if (_instance) return _instance;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  _instance = new Razorpay({ key_id, key_secret });
  return _instance;
}

export function verifySignature({ order_id, payment_id, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(`${order_id}|${payment_id}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export async function createOrder({ amountRupees, currency = 'INR', receipt, notes }) {
  const rzp = getRazorpay();
  if (!rzp) throw new Error('Razorpay not configured');
  const order = await rzp.orders.create({
    amount: Math.round(amountRupees * 100), // paise
    currency,
    receipt,
    notes: notes || {},
  });
  return order;
}

export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID || '';
}
