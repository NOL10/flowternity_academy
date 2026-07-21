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

// Verify Razorpay webhook signature (uses WEBHOOK secret, distinct from KEY secret)
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: 'RAZORPAY_WEBHOOK_SECRET not configured' };
  if (!signature) return { ok: false, reason: 'Missing X-Razorpay-Signature header' };
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    return valid ? { ok: true } : { ok: false, reason: 'signature mismatch' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// Real Razorpay refund via SDK
export async function refundPayment({ payment_id, amountPaise, notes }) {
  const rzp = getRazorpay();
  if (!rzp) throw new Error('Razorpay not configured');
  const body = { notes: notes || {} };
  if (amountPaise) body.amount = amountPaise; // paise; omit for full refund
  const refund = await rzp.payments.refund(payment_id, body);
  return refund;
}
