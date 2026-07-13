import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, clean } from '@/lib/flowternity/db';
import { hashPassword, verifyPassword, createToken, setAuthCookie, clearAuthCookie, getSession } from '@/lib/flowternity/auth-server';
import { SPORTS, MEMBERSHIPS, MAX_PAUSE_DAYS } from '@/lib/flowternity/config';

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

const j = (data, status = 200) => cors(NextResponse.json(data, { status }));
const err = (message, status = 400) => j({ error: message }, status);

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })); }

async function requireUser() {
  const session = await getSession();
  if (!session) return { error: err('Unauthorized', 401) };
  const db = await getDb();
  const user = await db.collection('users').findOne({ id: session.sub });
  if (!user) return { error: err('User not found', 401) };
  return { user, session };
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, _id, ...rest } = u;
  return rest;
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    const db = await getDb();

    // -------- HEALTH --------
    if (route === '/' || route === '/root') return j({ ok: true, app: 'Flowternity', ts: Date.now() });

    // -------- CONFIG --------
    if (route === '/config' && method === 'GET') {
      return j({ sports: SPORTS, memberships: MEMBERSHIPS });
    }

    // -------- AUTH --------
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json();
      const { full_name, email, phone, password, role } = body || {};
      if (!full_name || !email || !password) return err('full_name, email, password required');
      if (password.length < 6) return err('Password must be 6+ chars');
      const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (existing) return err('Email already registered', 409);
      const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
      const user = {
        id: uuidv4(),
        role: isAdmin ? 'admin' : (role === 'parent' ? 'parent' : 'adult'),
        full_name,
        email: email.toLowerCase(),
        phone: phone || '',
        address: '',
        emergency_contact: '',
        photo_url: '',
        password_hash: hashPassword(password),
        created_at: new Date(),
      };
      await db.collection('users').insertOne(user);
      const token = createToken(user);
      await setAuthCookie(token);
      return j({ user: publicUser(user) });
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) return err('email & password required');
      const u = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (!u || !verifyPassword(password, u.password_hash)) return err('Invalid credentials', 401);
      const token = createToken(u);
      await setAuthCookie(token);
      return j({ user: publicUser(u) });
    }

    if (route === '/auth/logout' && method === 'POST') {
      await clearAuthCookie();
      return j({ ok: true });
    }

    if (route === '/auth/me' && method === 'GET') {
      const session = await getSession();
      if (!session) return err('Unauthenticated', 401);
      const u = await db.collection('users').findOne({ id: session.sub });
      if (!u) return err('User not found', 404);
      return j({ user: publicUser(u) });
    }

    // -------- PROFILE --------
    if (route === '/profile' && method === 'PATCH') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const body = await request.json();
      const allowed = ['full_name', 'phone', 'address', 'emergency_contact', 'photo_url'];
      const update = {};
      for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
      await db.collection('users').updateOne({ id: auth.user.id }, { $set: update });
      const u = await db.collection('users').findOne({ id: auth.user.id });
      return j({ user: publicUser(u) });
    }

    // -------- CHILD PROFILES --------
    if (route === '/children' && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const { child_name, dob, gender, selected_sports } = await request.json();
      if (!child_name || !dob) return err('child_name & dob required');
      const child = {
        id: uuidv4(),
        parent_id: auth.user.id,
        child_name, dob, gender: gender || '',
        selected_sports: Array.isArray(selected_sports) ? selected_sports.slice(0, 2) : [],
        created_at: new Date(),
      };
      await db.collection('child_profiles').insertOne(child);
      return j({ child: clean(child) });
    }

    if (route === '/children' && method === 'GET') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const kids = await db.collection('child_profiles').find({ parent_id: auth.user.id }).toArray();
      return j({ children: kids.map(clean) });
    }

    // -------- CHECKOUT (MOCK PAYMENT) --------
    if (route === '/checkout/mock' && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const { membership_id, child_profile_id, selected_sports } = await request.json();
      const mem = MEMBERSHIPS.find(m => m.id === membership_id);
      if (!mem) return err('Invalid membership');

      // Enforce category vs user role: kids memberships require child profile
      if (mem.category === 'kids' && !child_profile_id) return err('Child profile required for kids membership');

      // Expire an active membership on the same slot if exists
      const now = new Date();
      const expiry = new Date(now); expiry.setMonth(expiry.getMonth() + mem.duration_months);

      const um = {
        id: uuidv4(),
        user_id: auth.user.id,
        child_profile_id: child_profile_id || null,
        membership_id: mem.id,
        membership_snapshot: mem,
        selected_sports: Array.isArray(selected_sports) ? selected_sports.slice(0, mem.max_sports || 99) : [],
        start_date: now,
        expiry_date: expiry,
        status: 'active',
        pause_days: 0,
        paused_at: null,
        created_at: now,
      };
      await db.collection('user_memberships').insertOne(um);

      const payment = {
        id: uuidv4(),
        user_id: auth.user.id,
        amount: mem.price,
        currency: 'INR',
        status: 'success',
        method: 'mock',
        ref: 'MOCK_' + uuidv4().slice(0, 8).toUpperCase(),
        membership_id: mem.id,
        user_membership_id: um.id,
        created_at: now,
      };
      await db.collection('payments').insertOne(payment);

      return j({ user_membership: clean(um), payment: clean(payment) });
    }

    // -------- DASHBOARD --------
    if (route === '/dashboard' && method === 'GET') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const now = new Date();

      const memberships = await db.collection('user_memberships')
        .find({ user_id: auth.user.id }).sort({ created_at: -1 }).toArray();

      // Auto-expire
      for (const m of memberships) {
        if (m.status === 'active' && new Date(m.expiry_date) < now) {
          await db.collection('user_memberships').updateOne({ id: m.id }, { $set: { status: 'expired' } });
          m.status = 'expired';
        }
      }

      const activeMembership = memberships.find(m => m.status === 'active' || m.status === 'paused') || null;

      const bookings = await db.collection('bookings').find({ user_id: auth.user.id, status: 'booked' }).toArray();
      const classIds = bookings.map(b => b.class_id);
      const classes = classIds.length ? await db.collection('classes').find({ id: { $in: classIds } }).toArray() : [];
      const upcoming = bookings.map(b => {
        const cls = classes.find(c => c.id === b.class_id);
        if (!cls) return null;
        const sport = SPORTS.find(s => s.id === cls.sport_id);
        return { booking_id: b.id, class: clean(cls), sport_name: sport?.name || cls.sport_id };
      }).filter(x => x && new Date(x.class.date) >= new Date(now.toDateString()))
        .sort((a, b) => new Date(a.class.date + 'T' + a.class.start_time) - new Date(b.class.date + 'T' + b.class.start_time));

      const payments = await db.collection('payments').find({ user_id: auth.user.id }).sort({ created_at: -1 }).limit(5).toArray();
      const announcements = await db.collection('announcements').find({}).sort({ created_at: -1 }).limit(3).toArray();

      return j({
        user: publicUser(auth.user),
        active_membership: activeMembership ? clean(activeMembership) : null,
        memberships: memberships.map(clean),
        upcoming_classes: upcoming,
        payments: payments.map(clean),
        announcements: announcements.map(clean),
      });
    }

    // -------- CLASSES --------
    if (route === '/classes' && method === 'GET') {
      const url = new URL(request.url);
      const sport = url.searchParams.get('sport');
      const day = url.searchParams.get('day'); // YYYY-MM-DD
      const filter = {};
      if (sport) filter.sport_id = sport;
      if (day) filter.date = day;
      const today = new Date().toISOString().slice(0, 10);
      filter.date = filter.date || { $gte: today };
      const classes = await db.collection('classes').find(filter).sort({ date: 1, start_time: 1 }).limit(200).toArray();

      // enrich with booked count & sport
      const classIds = classes.map(c => c.id);
      const bookings = classIds.length
        ? await db.collection('bookings').find({ class_id: { $in: classIds }, status: 'booked' }).toArray()
        : [];
      const counts = bookings.reduce((acc, b) => (acc[b.class_id] = (acc[b.class_id] || 0) + 1, acc), {});

      const session = await getSession();
      const myBookings = session ? new Set(bookings.filter(b => b.user_id === session.sub).map(b => b.class_id)) : new Set();

      const enriched = classes.map(c => ({
        ...clean(c),
        booked_count: counts[c.id] || 0,
        sport: SPORTS.find(s => s.id === c.sport_id) || null,
        is_booked: myBookings.has(c.id),
      }));
      return j({ classes: enriched });
    }

    // -------- BOOKINGS --------
    if (route === '/bookings' && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const { class_id, child_profile_id } = await request.json();
      const cls = await db.collection('classes').findOne({ id: class_id });
      if (!cls) return err('Class not found', 404);

      // Must have active membership
      const um = await db.collection('user_memberships').findOne({
        user_id: auth.user.id, status: 'active'
      });
      if (!um) return err('No active membership. Please purchase one.', 403);

      // For kids memberships, class sport must be in selected sports
      if (um.membership_snapshot?.category === 'kids') {
        if (!um.selected_sports?.includes(cls.sport_id)) {
          return err('This sport is not part of your kid\'s selection', 403);
        }
      }

      const already = await db.collection('bookings').findOne({ user_id: auth.user.id, class_id, status: 'booked' });
      if (already) return err('Already booked', 409);

      const activeCount = await db.collection('bookings').countDocuments({ class_id, status: 'booked' });
      if (activeCount >= cls.capacity) return err('Class is full', 409);

      const booking = {
        id: uuidv4(),
        user_id: auth.user.id,
        class_id,
        child_profile_id: child_profile_id || null,
        status: 'booked',
        created_at: new Date(),
      };
      await db.collection('bookings').insertOne(booking);
      return j({ booking: clean(booking) });
    }

    const bookingCancelMatch = route.match(/^\/bookings\/([^/]+)\/cancel$/);
    if (bookingCancelMatch && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const bid = bookingCancelMatch[1];
      const b = await db.collection('bookings').findOne({ id: bid, user_id: auth.user.id });
      if (!b) return err('Booking not found', 404);
      await db.collection('bookings').updateOne({ id: bid }, { $set: { status: 'cancelled', cancelled_at: new Date() } });
      return j({ ok: true });
    }

    // -------- MEMBERSHIP PAUSE/RESUME --------
    if (route === '/memberships/pause' && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const { days } = await request.json();
      const um = await db.collection('user_memberships').findOne({ user_id: auth.user.id, status: 'active' });
      if (!um) return err('No active membership');
      if ((um.pause_days || 0) > 0) return err('You have already used your pause');
      const d = Math.min(Math.max(parseInt(days) || 7, 1), MAX_PAUSE_DAYS);
      await db.collection('user_memberships').updateOne({ id: um.id }, {
        $set: { status: 'paused', pause_days: d, paused_at: new Date() }
      });
      return j({ ok: true, paused_days: d });
    }

    if (route === '/memberships/resume' && method === 'POST') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const um = await db.collection('user_memberships').findOne({ user_id: auth.user.id, status: 'paused' });
      if (!um) return err('No paused membership');
      // Extend expiry by pause_days
      const newExpiry = new Date(um.expiry_date);
      newExpiry.setDate(newExpiry.getDate() + (um.pause_days || 0));
      await db.collection('user_memberships').updateOne({ id: um.id }, {
        $set: { status: 'active', expiry_date: newExpiry, resumed_at: new Date() }
      });
      return j({ ok: true, new_expiry: newExpiry });
    }

    // -------- FORGOT / RESET PASSWORD (MVP: in-app link, no email) --------
    if (route === '/auth/forgot' && method === 'POST') {
      const { email } = await request.json();
      if (!email) return err('email required');
      const u = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (!u) return j({ ok: true, message: 'If an account exists, a reset link has been generated.', reset_link: null });
      const token = uuidv4() + uuidv4().replace(/-/g, '');
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      await db.collection('password_resets').insertOne({ id: uuidv4(), user_id: u.id, token, expires, used: false, created_at: new Date() });
      const base = process.env.NEXT_PUBLIC_BASE_URL || '';
      return j({ ok: true, reset_link: `${base}/reset?token=${token}`, token, message: 'MVP mode: use the link below (in real prod, this is emailed).' });
    }

    if (route === '/auth/reset' && method === 'POST') {
      const { token, password } = await request.json();
      if (!token || !password) return err('token & password required');
      if (password.length < 6) return err('Password must be 6+ chars');
      const rec = await db.collection('password_resets').findOne({ token, used: false });
      if (!rec) return err('Invalid or used token', 400);
      if (new Date(rec.expires) < new Date()) return err('Token expired', 400);
      await db.collection('users').updateOne({ id: rec.user_id }, { $set: { password_hash: hashPassword(password) } });
      await db.collection('password_resets').updateOne({ id: rec.id }, { $set: { used: true, used_at: new Date() } });
      return j({ ok: true });
    }

    // -------- FULL PROFILE (kids vs adult view) --------
    if (route === '/profile/full' && method === 'GET') {
      const auth = await requireUser(); if (auth.error) return auth.error;
      const children = await db.collection('child_profiles').find({ parent_id: auth.user.id }).toArray();
      const memberships = await db.collection('user_memberships').find({ user_id: auth.user.id }).sort({ created_at: -1 }).toArray();
      const payments = await db.collection('payments').find({ user_id: auth.user.id }).sort({ created_at: -1 }).limit(20).toArray();
      return j({ user: publicUser(auth.user), children: children.map(clean), memberships: memberships.map(clean), payments: payments.map(clean) });
    }

    // -------- PUBLIC COACHES --------
    if (route === '/coaches' && method === 'GET') {
      const list = await db.collection('coaches').find({}).sort({ created_at: -1 }).toArray();
      return j({ coaches: list.map(clean) });
    }

    // -------- ADMIN --------
    if (route.startsWith('/admin/')) {
      const auth = await requireUser(); if (auth.error) return auth.error;
      if (auth.user.role !== 'admin') return err('Admin only', 403);

      if (route === '/admin/classes' && method === 'POST') {
        const { sport_id, coach_name, date, start_time, end_time, capacity } = await request.json();
        if (!sport_id || !date || !start_time || !end_time || !capacity) return err('Missing fields');
        const cls = {
          id: uuidv4(),
          sport_id, coach_name: coach_name || 'Head Coach',
          date, start_time, end_time, capacity: parseInt(capacity),
          created_at: new Date(),
          created_by: auth.user.id,
        };
        await db.collection('classes').insertOne(cls);
        return j({ class: clean(cls) });
      }

      if (route === '/admin/classes' && method === 'GET') {
        const classes = await db.collection('classes').find({}).sort({ date: 1, start_time: 1 }).toArray();
        return j({ classes: classes.map(clean) });
      }

      const delMatch = route.match(/^\/admin\/classes\/([^/]+)$/);
      if (delMatch && method === 'DELETE') {
        await db.collection('classes').deleteOne({ id: delMatch[1] });
        await db.collection('bookings').updateMany({ class_id: delMatch[1] }, { $set: { status: 'cancelled', cancelled_at: new Date() } });
        return j({ ok: true });
      }

      if (route === '/admin/stats' && method === 'GET') {
        const total = await db.collection('users').countDocuments({});
        const active = await db.collection('user_memberships').countDocuments({ status: 'active' });
        const today = new Date().toISOString().slice(0, 10);
        const todayClasses = await db.collection('classes').countDocuments({ date: today });
        const totalBookings = await db.collection('bookings').countDocuments({ status: 'booked' });
        return j({ total_users: total, active_memberships: active, today_classes: todayClasses, active_bookings: totalBookings });
      }

      if (route === '/admin/announcements' && method === 'POST') {
        const { title, message } = await request.json();
        if (!title || !message) return err('title & message required');
        const a = { id: uuidv4(), title, message, created_at: new Date() };
        await db.collection('announcements').insertOne(a);
        return j({ announcement: clean(a) });
      }

      if (route === '/admin/announcements' && method === 'GET') {
        const list = await db.collection('announcements').find({}).sort({ created_at: -1 }).toArray();
        return j({ announcements: list.map(clean) });
      }

      const annDel = route.match(/^\/admin\/announcements\/([^/]+)$/);
      if (annDel && method === 'DELETE') {
        await db.collection('announcements').deleteOne({ id: annDel[1] });
        return j({ ok: true });
      }

      // -------- Members --------
      if (route === '/admin/members' && method === 'GET') {
        const url = new URL(request.url);
        const q = (url.searchParams.get('q') || '').toLowerCase().trim();
        const users = await db.collection('users').find({}).sort({ created_at: -1 }).limit(500).toArray();
        const filtered = q ? users.filter(u =>
          (u.full_name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').includes(q)
        ) : users;
        const uids = filtered.map(u => u.id);
        const ums = uids.length ? await db.collection('user_memberships').find({ user_id: { $in: uids } }).toArray() : [];
        const latestByUser = {};
        for (const m of ums) {
          if (!latestByUser[m.user_id] || new Date(m.created_at) > new Date(latestByUser[m.user_id].created_at)) latestByUser[m.user_id] = m;
        }
        return j({ members: filtered.map(u => ({ ...publicUser(u), latest_membership: latestByUser[u.id] ? clean(latestByUser[u.id]) : null })) });
      }

      const memPatch = route.match(/^\/admin\/members\/([^/]+)$/);
      if (memPatch && method === 'PATCH') {
        const body = await request.json();
        const allowed = ['full_name', 'phone', 'address', 'emergency_contact', 'role', 'status'];
        const upd = {};
        for (const k of allowed) if (body[k] !== undefined) upd[k] = body[k];
        await db.collection('users').updateOne({ id: memPatch[1] }, { $set: upd });
        const u = await db.collection('users').findOne({ id: memPatch[1] });
        return j({ user: publicUser(u) });
      }

      const memDeact = route.match(/^\/admin\/members\/([^/]+)\/deactivate$/);
      if (memDeact && method === 'POST') {
        await db.collection('users').updateOne({ id: memDeact[1] }, { $set: { status: 'inactive' } });
        await db.collection('user_memberships').updateMany({ user_id: memDeact[1], status: 'active' }, { $set: { status: 'expired' } });
        return j({ ok: true });
      }

      const memDetail = route.match(/^\/admin\/members\/([^/]+)\/detail$/);
      if (memDetail && method === 'GET') {
        const id = memDetail[1];
        const u = await db.collection('users').findOne({ id });
        if (!u) return err('Not found', 404);
        const children = await db.collection('child_profiles').find({ parent_id: id }).toArray();
        const memberships = await db.collection('user_memberships').find({ user_id: id }).sort({ created_at: -1 }).toArray();
        const payments = await db.collection('payments').find({ user_id: id }).sort({ created_at: -1 }).toArray();
        const bookings = await db.collection('bookings').find({ user_id: id }).sort({ created_at: -1 }).limit(20).toArray();
        return j({ user: publicUser(u), children: children.map(clean), memberships: memberships.map(clean), payments: payments.map(clean), bookings: bookings.map(clean) });
      }

      // -------- Attendance / Roster --------
      const rosterMatch = route.match(/^\/admin\/classes\/([^/]+)\/roster$/);
      if (rosterMatch && method === 'GET') {
        const cid = rosterMatch[1];
        const cls = await db.collection('classes').findOne({ id: cid });
        if (!cls) return err('Class not found', 404);
        const bookings = await db.collection('bookings').find({ class_id: cid, status: 'booked' }).toArray();
        const uids = bookings.map(b => b.user_id);
        const users = uids.length ? await db.collection('users').find({ id: { $in: uids } }).toArray() : [];
        const kids = await db.collection('child_profiles').find({ id: { $in: bookings.map(b => b.child_profile_id).filter(Boolean) } }).toArray();
        const att = await db.collection('attendance').find({ class_id: cid }).toArray();
        return j({
          class: clean(cls),
          roster: bookings.map(b => {
            const u = users.find(x => x.id === b.user_id);
            const kid = b.child_profile_id ? kids.find(k => k.id === b.child_profile_id) : null;
            const a = att.find(x => x.booking_id === b.id);
            return {
              booking_id: b.id,
              user_id: b.user_id,
              name: kid ? kid.child_name : (u?.full_name || 'Unknown'),
              subtitle: kid ? `Kid of ${u?.full_name}` : (u?.email || ''),
              present: a ? a.present : null,
            };
          }),
        });
      }

      if (route === '/admin/attendance' && method === 'POST') {
        const { class_id, records } = await request.json();
        if (!class_id || !Array.isArray(records)) return err('class_id & records[] required');
        for (const r of records) {
          await db.collection('attendance').updateOne(
            { booking_id: r.booking_id },
            {
              $set: {
                class_id, present: !!r.present, marked_at: new Date(), marked_by: auth.user.id,
              },
              $setOnInsert: { id: uuidv4(), booking_id: r.booking_id, created_at: new Date() },
            },
            { upsert: true }
          );
        }
        return j({ ok: true, count: records.length });
      }

      // -------- Payments (admin) --------
      if (route === '/admin/payments' && method === 'GET') {
        const payments = await db.collection('payments').find({}).sort({ created_at: -1 }).limit(500).toArray();
        const uids = [...new Set(payments.map(p => p.user_id))];
        const users = uids.length ? await db.collection('users').find({ id: { $in: uids } }).toArray() : [];
        return j({
          payments: payments.map(p => {
            const u = users.find(x => x.id === p.user_id);
            return { ...clean(p), user_name: u?.full_name || 'Unknown', user_email: u?.email || '' };
          })
        });
      }

      // -------- Coaches --------
      if (route === '/admin/coaches' && method === 'POST') {
        const { full_name, email, phone, sports, bio } = await request.json();
        if (!full_name || !email) return err('full_name & email required');
        const c = { id: uuidv4(), full_name, email: email.toLowerCase(), phone: phone || '', sports: Array.isArray(sports) ? sports : [], bio: bio || '', photo_url: '', created_at: new Date() };
        await db.collection('coaches').insertOne(c);
        return j({ coach: clean(c) });
      }
      if (route === '/admin/coaches' && method === 'GET') {
        const list = await db.collection('coaches').find({}).sort({ created_at: -1 }).toArray();
        return j({ coaches: list.map(clean) });
      }
      const coachDel = route.match(/^\/admin\/coaches\/([^/]+)$/);
      if (coachDel && method === 'DELETE') {
        await db.collection('coaches').deleteOne({ id: coachDel[1] });
        return j({ ok: true });
      }
    }

    return err(`Route ${route} not found`, 404);
  } catch (e) {
    console.error('API Error:', e);
    return err('Internal server error: ' + e.message, 500);
  }
}

export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
