import { Resend } from 'resend';

const key = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'Flowternity <onboarding@resend.dev>';
const BASE = process.env.NEXT_PUBLIC_BASE_URL || '';

let resend = null;
if (key) {
  try { resend = new Resend(key); } catch (e) { console.warn('Resend init failed', e.message); }
}

async function safeSend(payload) {
  if (!resend) { console.warn('[email] no RESEND_API_KEY set, skipping'); return { skipped: true }; }
  try {
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.warn('[email] send error:', error.message || JSON.stringify(error));
      return { error: error.message };
    }
    return { data };
  } catch (e) {
    console.warn('[email] threw:', e.message);
    return { error: e.message };
  }
}

const btn = (label, href) => `<a href="${href}" style="display:inline-block;background:#000;color:#C6F84E;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-family:Inter,sans-serif;font-size:15px">${label}</a>`;

const shell = (title, body) => `
<!doctype html>
<html><body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,-apple-system,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:#C6F84E;border-radius:8px;display:inline-block;text-align:center;line-height:32px;font-weight:900">⚡</div>
      <span style="font-weight:900;letter-spacing:-0.02em;font-size:20px">FLOWTERNITY</span>
    </div>
    <div style="background:#fff;border-radius:24px;padding:32px;border:1px solid #eaeaea">
      <h1 style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:900;font-size:28px;line-height:1.1;margin:0 0 12px;letter-spacing:-0.02em">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#666;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} Flowternity · Train with purpose</p>
  </div>
</body></html>`;

export async function sendPasswordResetEmail({ to, name, resetLink }) {
  const html = shell('Reset your password', `
    <p style="color:#444;line-height:1.6">Hi ${name || 'there'},</p>
    <p style="color:#444;line-height:1.6">We got a request to reset your Flowternity password. Click the button below to set a new one. This link expires in 30 minutes.</p>
    <div style="margin:28px 0">${btn('Reset password', resetLink)}</div>
    <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#888;font-size:12px;word-break:break-all">Or copy this link: ${resetLink}</p>
  `);
  return safeSend({ from: FROM, to, subject: 'Reset your Flowternity password', html });
}

export async function sendWelcomeEmail({ to, name, tempPassword }) {
  const loginUrl = `${BASE}/auth?mode=login`;
  const html = shell(`Welcome to Flowternity, ${name?.split(' ')[0] || 'athlete'}!`, `
    <p style="color:#444;line-height:1.6">An admin has created your account. Use the credentials below to sign in:</p>
    <div style="background:#F5F3EE;border-radius:12px;padding:16px 20px;margin:20px 0;font-family:monospace">
      <div style="font-size:13px;color:#666">Email</div>
      <div style="font-weight:600;font-size:15px;margin-bottom:12px">${to}</div>
      <div style="font-size:13px;color:#666">Temporary password</div>
      <div style="font-weight:600;font-size:15px">${tempPassword}</div>
    </div>
    <div style="margin:20px 0">${btn('Sign in now', loginUrl)}</div>
    <p style="color:#888;font-size:13px">Please change your password after first login.</p>
  `);
  return safeSend({ from: FROM, to, subject: 'Your Flowternity account is ready', html });
}

export async function sendBookingConfirmationEmail({ to, name, sport, date, startTime, endTime, coach }) {
  const dashUrl = `${BASE}/dashboard`;
  const dateFmt = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const html = shell('Booking confirmed', `
    <p style="color:#444;line-height:1.6">Hi ${name?.split(' ')[0] || 'there'}, your class is booked. See you there.</p>
    <div style="background:#F5F3EE;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-weight:800;font-size:20px">${sport}</div>
      <div style="color:#666;margin-top:6px">📅 ${dateFmt}</div>
      <div style="color:#666;margin-top:2px">🕒 ${startTime} – ${endTime}</div>
      <div style="color:#666;margin-top:2px">👤 Coach ${coach}</div>
    </div>
    <div style="margin:20px 0">${btn('View dashboard', dashUrl)}</div>
    <p style="color:#888;font-size:13px">Need to cancel? You can do it anytime from your dashboard.</p>
  `);
  return safeSend({ from: FROM, to, subject: `Booked: ${sport} on ${dateFmt}`, html });
}

export async function sendMembershipPurchaseEmail({ to, name, membershipName, months, price, expiryDate }) {
  const dashUrl = `${BASE}/dashboard`;
  const expFmt = new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const html = shell('Membership activated 🎉', `
    <p style="color:#444;line-height:1.6">Welcome to the club, ${name?.split(' ')[0] || 'athlete'}! Your membership is active.</p>
    <div style="background:#F5F3EE;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-weight:800;font-size:20px">${membershipName} · ${months}M</div>
      <div style="color:#666;margin-top:6px">Paid: ₹${price.toLocaleString('en-IN')}</div>
      <div style="color:#666;margin-top:2px">Valid until: ${expFmt}</div>
    </div>
    <div style="margin:20px 0">${btn('Book your first class', dashUrl)}</div>
  `);
  return safeSend({ from: FROM, to, subject: 'Your Flowternity membership is active', html });
}
