'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { SPORTS, MEMBERSHIPS as MEMBERSHIPS_LOCAL } from '@/lib/flowternity/config';
import {
  Trash2, Plus, Users, Calendar, Activity, Sparkles, Search, CreditCard,
  Megaphone, UserCog, ClipboardList, CheckCircle2, XCircle, Save, Flame,
  LayoutDashboard, ArrowLeft, LogOut, ChevronRight, Home, TrendingUp
} from 'lucide-react';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'classes', label: 'Classes', icon: ClipboardList },
  { id: 'games', label: 'Games', icon: Flame },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'coaches', label: 'Coaches', icon: UserCog },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/auth?mode=login&next=/admin'); return; }
      if (user.role !== 'admin') { toast.error('Admin only'); router.push('/dashboard'); return; }
      fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()).then(setStats);
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const current = NAV.find(n => n.id === tab) || NAV[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 admin-scope">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(v => !v)}
              className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-800"
              aria-label="Toggle navigation"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${mobileNav ? 'rotate-90' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-lime-400 text-slate-900 flex items-center justify-center font-black text-sm">F</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight">Flowternity</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-widest font-semibold">Admin</span>
              </div>
            </div>
            <span className="hidden md:inline text-slate-600">/</span>
            <span className="hidden md:inline text-sm text-slate-300">{current.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-800">
              <Home className="w-3.5 h-3.5" /> Member site
            </Link>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-lime-400 text-slate-900 flex items-center justify-center font-bold text-xs">
                {user.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="text-xs">
                <div className="font-medium leading-tight">{user.full_name}</div>
                <div className="text-slate-500 leading-tight">{user.email}</div>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileNav ? 'block' : 'hidden'} md:block fixed md:sticky top-14 z-20 md:z-0 h-[calc(100vh-3.5rem)] w-64 border-r border-slate-800 bg-slate-950 overflow-y-auto`}>
          <nav className="p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 px-3 py-2">Console</p>
            {NAV.map(n => {
              const active = tab === n.id;
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => { setTab(n.id); setMobileNav(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${
                    active
                      ? 'bg-lime-400/10 text-lime-400 font-medium'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{n.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </nav>
          <div className="p-3 mt-4 border-t border-slate-800">
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3">
              <p className="text-xs text-slate-400 mb-2">Quick stats</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Users</span><span className="font-mono font-semibold">{stats?.total_users ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-mono font-semibold text-lime-400">{stats?.active_memberships ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Today</span><span className="font-mono font-semibold">{stats?.today_classes ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Bookings</span><span className="font-mono font-semibold">{stats?.active_bookings ?? '—'}</span></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-3.5rem)]">
          <div className="p-4 md:p-8 max-w-[1400px]">
            {tab === 'overview' && <OverviewSection stats={stats} />}
            {tab === 'classes' && <ClassesSection />}
            {tab === 'games' && <GamesSection />}
            {tab === 'members' && <MembersSection />}
            {tab === 'attendance' && <AttendanceSection />}
            {tab === 'payments' && <PaymentsSection />}
            {tab === 'coaches' && <CoachesSection />}
            {tab === 'announcements' && <AnnouncementsSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

// -------- Reusable section header --------
function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-900 border-slate-800',
    accent: 'bg-lime-400/5 border-lime-400/20',
  };
  return (
    <Card className={`p-5 rounded-lg border ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="mt-3 font-mono font-semibold text-3xl text-slate-50 tabular-nums">{value ?? '—'}</div>
      {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
    </Card>
  );
}

// ===================== OVERVIEW =====================
function OverviewSection({ stats }) {
  const [recent, setRecent] = useState({ members: [], classes: [], payments: [] });
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/members', { credentials: 'include' }).then(r => r.json()).catch(() => ({ members: [] })),
      fetch('/api/admin/classes', { credentials: 'include' }).then(r => r.json()).catch(() => ({ classes: [] })),
      fetch('/api/admin/payments', { credentials: 'include' }).then(r => r.json()).catch(() => ({ payments: [] })),
    ]).then(([m, c, p]) => setRecent({
      members: (m.members || []).slice(0, 5),
      classes: (c.classes || []).slice(0, 5),
      payments: (p.payments || []).slice(0, 5),
    }));
  }, []);

  return (
    <>
      <SectionHeader
        title="Overview"
        description="At-a-glance view of the academy's operations."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users} tone="accent" />
        <StatCard icon={Sparkles} label="Active Memberships" value={stats?.active_memberships} />
        <StatCard icon={Calendar} label="Today's Classes" value={stats?.today_classes} />
        <StatCard icon={Activity} label="Active Bookings" value={stats?.active_bookings} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 rounded-lg bg-slate-900 border-slate-800 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-lime-400" /> Recent members</h3>
          {recent.members.length === 0 ? (
            <p className="text-xs text-slate-500">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.members.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">{m.full_name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-slate-100">{m.full_name}</div>
                    <div className="text-xs text-slate-500 truncate">{m.email}</div>
                  </div>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-0 text-[10px] capitalize">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5 rounded-lg bg-slate-900 border-slate-800 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-lime-400" /> Upcoming classes</h3>
          {recent.classes.length === 0 ? (
            <p className="text-xs text-slate-500">No classes scheduled.</p>
          ) : (
            <div className="space-y-2">
              {recent.classes.map(c => {
                const sport = SPORTS.find(s => s.id === c.sport_id);
                return (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <div className="w-9 h-9 rounded bg-slate-800 flex flex-col items-center justify-center leading-none">
                      <span className="text-[9px] uppercase text-slate-500">{new Date(c.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      <span className="text-xs font-bold text-slate-100">{new Date(c.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-slate-100">{sport?.name}</div>
                      <div className="text-xs text-slate-500 truncate">{c.start_time}–{c.end_time} · {c.coach_name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card className="p-5 rounded-lg bg-slate-900 border-slate-800 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-lime-400" /> Recent payments</h3>
          {recent.payments.length === 0 ? (
            <p className="text-xs text-slate-500">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.payments.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-slate-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-slate-100">{p.user_name}</div>
                    <div className="text-xs text-slate-500 truncate">{new Date(p.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-100">₹{p.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

// ===================== CLASSES =====================
function ClassesSection() {
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const emptyForm = { sport_id: 'basketball', coach_name: '', date: '', start_time: '', end_time: '', capacity: 12 };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const c = await fetch('/api/admin/classes', { credentials: 'include' }).then(r => r.json());
    setClasses(c.classes || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e, keepOpen) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/classes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(d.error || 'Failed to schedule'); return; }
    toast.success('Class scheduled');
    load();
    if (keepOpen) {
      // keep sport/coach/capacity, reset date+times to make next entry fast
      setForm(f => ({ ...f, date: '', start_time: '', end_time: '' }));
    } else {
      setForm(emptyForm);
      setOpen(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this class? All bookings will be cancelled.')) return;
    const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { toast.success('Deleted'); load(); }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return classes;
    return classes.filter(c => c.sport_id === filter);
  }, [classes, filter]);

  return (
    <>
      <SectionHeader
        title="Classes"
        description={`${classes.length} scheduled · manage the class roster.`}
        action={
          <Button onClick={() => setOpen(true)} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Class
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 uppercase tracking-widest">Filter</span>
        <button onClick={() => setFilter('all')} className={`text-xs px-2.5 py-1 rounded-full border ${filter === 'all' ? 'bg-slate-100 text-slate-900 border-slate-100' : 'border-slate-700 text-slate-400 hover:text-slate-100'}`}>All</button>
        {SPORTS.filter(s => s.status === 'active').map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)} className={`text-xs px-2.5 py-1 rounded-full border ${filter === s.id ? 'bg-slate-100 text-slate-900 border-slate-100' : 'border-slate-700 text-slate-400 hover:text-slate-100'}`}>{s.name}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No classes yet" cta="Schedule your first class" onClick={() => setOpen(true)} />
      ) : (
        <Card className="rounded-lg bg-slate-900 border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
            <div className="col-span-1">Date</div>
            <div className="col-span-3">Sport</div>
            <div className="col-span-3">Coach</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Capacity</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {filtered.map(c => {
            const sport = SPORTS.find(s => s.id === c.sport_id);
            return (
              <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
                <div className="col-span-4 md:col-span-1 flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-slate-800 flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] uppercase text-slate-500">{new Date(c.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-sm font-bold text-slate-100">{new Date(c.date).getDate()}</span>
                  </div>
                </div>
                <div className="col-span-8 md:col-span-3 font-medium text-slate-100">{sport?.name}</div>
                <div className="col-span-6 md:col-span-3 text-sm text-slate-300">{c.coach_name}</div>
                <div className="col-span-6 md:col-span-2 font-mono text-sm text-slate-300">{c.start_time}–{c.end_time}</div>
                <div className="col-span-6 md:col-span-2 text-sm text-slate-300">{c.capacity} slots</div>
                <div className="col-span-6 md:col-span-1 flex justify-end">
                  <button onClick={() => remove(c.id)} className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Schedule a class</DialogTitle>
            <DialogDescription className="text-slate-400">Fill the details — click &ldquo;Save &amp; add another&rdquo; to keep the dialog open.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => create(e, false)} className="space-y-3">
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-widest">Sport</Label>
              <Select value={form.sport_id} onValueChange={v => setForm({ ...form, sport_id: v })}>
                <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SPORTS.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-widest">Coach name</Label>
              <Input required className="h-11 mt-1" value={form.coach_name} onChange={e => setForm({ ...form, coach_name: e.target.value })} placeholder="Coach Ravi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Date</Label>
                <Input type="date" required className="h-11 mt-1" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Capacity</Label>
                <Input type="number" min="1" required className="h-11 mt-1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Start</Label>
                <Input type="time" required className="h-11 mt-1" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">End</Label>
                <Input type="time" required className="h-11 mt-1" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300">Cancel</Button>
              <Button type="button" disabled={saving} onClick={(e) => create(e, true)} variant="outline" className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">
                {saving ? '...' : 'Save & add another'}
              </Button>
              <Button type="submit" disabled={saving} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">
                <Plus className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== GAMES =====================
function GamesSection() {
  const [games, setGames] = useState([]);
  const [open, setOpen] = useState(false);
  const emptyForm = { sport_id: 'basketball', title: '', description: '', date: '', start_time: '', end_time: '', max_players: 10, host_name: 'Flowternity', skill_level: 'all_levels' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const d = await fetch('/api/admin/games', { credentials: 'include' }).then(r => r.json());
    setGames(d.games || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e, keepOpen) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(d.error || 'Failed'); return; }
    toast.success('Game scheduled');
    load();
    if (keepOpen) setForm(f => ({ ...f, title: '', description: '', date: '', start_time: '', end_time: '' }));
    else { setForm(emptyForm); setOpen(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this game? All players will be removed.')) return;
    const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { toast.success('Deleted'); load(); }
  };

  return (
    <>
      <SectionHeader
        title="Games"
        description={`${games.length} pickup games · community play sessions.`}
        action={
          <Button onClick={() => setOpen(true)} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Game
          </Button>
        }
      />

      {games.length === 0 ? (
        <EmptyState icon={Flame} title="No games scheduled" cta="Schedule your first game" onClick={() => setOpen(true)} />
      ) : (
        <Card className="rounded-lg bg-slate-900 border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
            <div className="col-span-1">Date</div>
            <div className="col-span-4">Game</div>
            <div className="col-span-2">Sport</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Players</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {games.map(g => {
            const sport = SPORTS.find(s => s.id === g.sport_id);
            return (
              <div key={g.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                <div className="col-span-4 md:col-span-1">
                  <div className="w-10 h-10 rounded bg-slate-800 flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] uppercase text-slate-500">{new Date(g.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-sm font-bold text-slate-100">{new Date(g.date).getDate()}</span>
                  </div>
                </div>
                <div className="col-span-8 md:col-span-4 min-w-0">
                  <div className="font-medium text-slate-100 truncate">{g.title || `${sport?.name} pickup`}</div>
                  <div className="text-xs text-slate-500 truncate">Host: {g.host_name} · {g.skill_level?.replace('_', ' ')}</div>
                </div>
                <div className="col-span-6 md:col-span-2 text-sm text-slate-300">{sport?.name}</div>
                <div className="col-span-6 md:col-span-2 font-mono text-sm text-slate-300">{g.start_time}–{g.end_time}</div>
                <div className="col-span-6 md:col-span-2 text-sm">
                  <span className="font-mono font-semibold text-slate-100">{g.participants_count}</span>
                  <span className="text-slate-500">/{g.max_players}</span>
                </div>
                <div className="col-span-6 md:col-span-1 flex justify-end">
                  <button onClick={() => remove(g.id)} className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Schedule a pickup game</DialogTitle>
            <DialogDescription className="text-slate-400">Community play session for members to join.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => create(e, false)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Sport</Label>
                <Select value={form.sport_id} onValueChange={v => setForm({ ...form, sport_id: v })}>
                  <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SPORTS.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Skill level</Label>
                <Select value={form.skill_level} onValueChange={v => setForm({ ...form, skill_level: v })}>
                  <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_levels">All levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Title <span className="text-slate-500 normal-case">(optional)</span></Label><Input className="h-11 mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Friday Night Hoops" /></div>
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Casual 5v5" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Date</Label><Input type="date" required className="h-11 mt-1" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Start</Label><Input type="time" required className="h-11 mt-1" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">End</Label><Input type="time" required className="h-11 mt-1" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Max players</Label><Input type="number" min="2" required className="h-11 mt-1" value={form.max_players} onChange={e => setForm({ ...form, max_players: e.target.value })} /></div>
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Host</Label><Input className="h-11 mt-1" value={form.host_name} onChange={e => setForm({ ...form, host_name: e.target.value })} /></div>
            </div>
            <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300">Cancel</Button>
              <Button type="button" disabled={saving} onClick={(e) => create(e, true)} variant="outline" className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">{saving ? '...' : 'Save & add another'}</Button>
              <Button type="submit" disabled={saving} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Plus className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Schedule'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== MEMBERS =====================
function MembersSection() {
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const emptyUser = { full_name: '', email: '', phone: '', role: 'adult', password: '', membership_id: '', selected_sports: [], child: { child_name: '', dob: '', gender: '' } };
  const [newUser, setNewUser] = useState(emptyUser);
  const [createdResult, setCreatedResult] = useState(null);

  const load = async () => {
    const url = q ? `/api/admin/members?q=${encodeURIComponent(q)}` : '/api/admin/members';
    const d = await fetch(url, { credentials: 'include' }).then(r => r.json());
    setMembers(d.members || []);
  };
  useEffect(() => { load(); }, [q]);

  const openDetail = async (m) => {
    setSelected(m);
    const d = await fetch(`/api/admin/members/${m.id}/detail`, { credentials: 'include' }).then(r => r.json());
    setDetail(d);
  };

  const save = async () => {
    if (!detail) return;
    const body = { full_name: detail.user.full_name, phone: detail.user.phone, address: detail.user.address, emergency_contact: detail.user.emergency_contact };
    const res = await fetch(`/api/admin/members/${detail.user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
    if (res.ok) { toast.success('Updated'); load(); }
  };

  const deactivate = async () => {
    if (!confirm(`Deactivate ${detail.user.full_name}?`)) return;
    const res = await fetch(`/api/admin/members/${detail.user.id}/deactivate`, { method: 'POST', credentials: 'include' });
    if (res.ok) { toast.success('Deactivated'); setSelected(null); setDetail(null); load(); }
  };

  const createMember = async (e) => {
    e.preventDefault();
    setCreating(true);
    const payload = { ...newUser };
    if (payload.role !== 'parent') delete payload.child;
    if (!payload.membership_id) { delete payload.membership_id; delete payload.selected_sports; }
    const res = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    const d = await res.json();
    if (res.ok) {
      toast.success('Member created' + (d.email_sent ? ' — email sent' : ''));
      setCreatedResult(d);
      setNewUser(emptyUser);
      load();
    } else toast.error(d.error || 'Failed');
    setCreating(false);
  };

  const toggleNewSport = (id) => setNewUser(u => {
    const cap = u.role === 'parent' ? 2 : 99;
    if (u.selected_sports.includes(id)) return { ...u, selected_sports: u.selected_sports.filter(x => x !== id) };
    if (u.selected_sports.length >= cap) { toast.error(`Max ${cap} sports`); return u; }
    return { ...u, selected_sports: [...u.selected_sports, id] };
  });

  return (
    <>
      <SectionHeader
        title="Members"
        description={`${members.length} registered`}
        action={
          <Button onClick={() => setAddOpen(true)} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Add Member
          </Button>
        }
      />

      <div className="relative max-w-md mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input placeholder="Search by name, email, phone…" value={q} onChange={e => setQ(e.target.value)} className="h-10 pl-9" />
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" cta="Register first member" onClick={() => setAddOpen(true)} />
      ) : (
        <Card className="rounded-lg bg-slate-900 border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Membership</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {members.map(m => (
            <div key={m.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
              <div className="col-span-12 md:col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center font-bold text-sm flex-shrink-0">{m.full_name?.[0]?.toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-100 truncate">{m.full_name}</div>
                  {m.status === 'inactive' && <Badge variant="destructive" className="text-[10px] mt-0.5">Inactive</Badge>}
                </div>
              </div>
              <div className="col-span-6 md:col-span-3 min-w-0 text-xs text-slate-400 truncate">
                <div className="truncate">{m.email}</div>
                <div className="truncate">{m.phone || '—'}</div>
              </div>
              <div className="col-span-6 md:col-span-2"><Badge variant="secondary" className="bg-slate-800 text-slate-300 border-0 capitalize">{m.role}</Badge></div>
              <div className="col-span-6 md:col-span-2 text-xs">
                {m.latest_membership ? (
                  <>
                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${m.latest_membership.status === 'active' ? 'bg-lime-400/20 text-lime-400' : 'bg-slate-800 text-slate-400'}`}>{m.latest_membership.status}</div>
                    <div className="text-slate-500 mt-0.5 truncate">{m.latest_membership.membership_snapshot?.name}</div>
                  </>
                ) : <span className="text-slate-600">None</span>}
              </div>
              <div className="col-span-6 md:col-span-1 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => openDetail(m)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100 h-8">View</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setCreatedResult(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-50">Register a new member</DialogTitle></DialogHeader>
          {createdResult ? (
            <div className="space-y-4">
              <Card className="p-4 rounded-lg bg-lime-400/10 border-lime-400/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-lime-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-100">Account created</h4>
                    <p className="text-sm text-slate-400 mt-1">{createdResult.email_sent ? 'Welcome email with credentials sent.' : `Email delivery failed. Share the credentials manually.`}</p>
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm">
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="font-semibold text-slate-100">{createdResult.user.email}</div>
                      <div className="text-xs text-slate-500 mt-2">Temporary password</div>
                      <div className="font-semibold text-lime-400">{createdResult.temp_password}</div>
                    </div>
                  </div>
                </div>
              </Card>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreatedResult(null)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">Add another</Button>
                <Button onClick={() => { setCreatedResult(null); setAddOpen(false); }} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">Done</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={createMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Role</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v, membership_id: '', selected_sports: [] })}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult">Adult Member</SelectItem>
                      <SelectItem value="parent">Parent (for kid)</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Password <span className="text-slate-500 normal-case">(auto if blank)</span></Label>
                  <Input className="h-11 mt-1" placeholder="Auto-generated" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Full name</Label><Input required className="h-11 mt-1" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} /></div>
                <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Email</Label><Input required type="email" className="h-11 mt-1" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                <div className="col-span-2"><Label className="text-slate-300 text-xs uppercase tracking-widest">Phone</Label><Input className="h-11 mt-1" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} /></div>
              </div>

              {newUser.role === 'parent' && (
                <Card className="p-4 rounded-lg bg-slate-950 border-slate-800">
                  <h4 className="font-semibold mb-2 text-sm text-slate-100">Child details (optional)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Child name</Label><Input className="h-11 mt-1" value={newUser.child.child_name} onChange={e => setNewUser({ ...newUser, child: { ...newUser.child, child_name: e.target.value } })} /></div>
                    <div><Label className="text-slate-300 text-xs uppercase tracking-widest">DOB</Label><Input type="date" className="h-11 mt-1" value={newUser.child.dob} onChange={e => setNewUser({ ...newUser, child: { ...newUser.child, dob: e.target.value } })} /></div>
                  </div>
                </Card>
              )}

              {(newUser.role === 'adult' || newUser.role === 'parent') && (
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Attach membership (optional)</Label>
                  <Select value={newUser.membership_id || 'none'} onValueChange={v => setNewUser({ ...newUser, membership_id: v === 'none' ? '' : v, selected_sports: [] })}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="No membership" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No membership</SelectItem>
                      {MEMBERSHIPS_LOCAL.filter(m => newUser.role === 'parent' ? m.category === 'kids' : m.category === 'adult').map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} · {m.duration_months}M · ₹{m.price.toLocaleString('en-IN')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newUser.membership_id && newUser.role === 'parent' && (
                    <div className="mt-3">
                      <p className="text-sm text-slate-400 mb-2">Pick up to 2 sports for the kid</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SPORTS.filter(s => s.status === 'active').map(s => (
                          <button type="button" key={s.id} onClick={() => toggleNewSport(s.id)} className={`p-2 rounded-lg border text-sm transition-colors ${newUser.selected_sports.includes(s.id) ? 'bg-lime-400 text-slate-900 border-lime-400 font-semibold' : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-600'}`}>{s.name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">Cancel</Button>
                <Button type="submit" disabled={creating} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">{creating ? 'Creating…' : 'Create & Send Email'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={o => { if (!o) { setSelected(null); setDetail(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-50">{selected?.full_name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Full name</Label><Input className="h-11 mt-1" value={detail.user.full_name || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, full_name: e.target.value } })} /></div>
                <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Phone</Label><Input className="h-11 mt-1" value={detail.user.phone || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, phone: e.target.value } })} /></div>
                <div className="col-span-2"><Label className="text-slate-300 text-xs uppercase tracking-widest">Address</Label><Textarea value={detail.user.address || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, address: e.target.value } })} /></div>
                <div className="col-span-2"><Label className="text-slate-300 text-xs uppercase tracking-widest">Emergency contact</Label><Input className="h-11 mt-1" value={detail.user.emergency_contact || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, emergency_contact: e.target.value } })} /></div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm text-slate-200">Memberships</h4>
                {detail.memberships.length === 0 ? <p className="text-sm text-slate-500">None</p> : (
                  <div className="space-y-2">{detail.memberships.map(m => (
                    <div key={m.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-slate-100">{m.membership_snapshot?.name} · {m.membership_snapshot?.duration_months}M</div>
                        <div className="text-xs text-slate-500">Expires {new Date(m.expiry_date).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-xs font-semibold ${m.status === 'active' ? 'bg-lime-400/20 text-lime-400' : 'bg-slate-800 text-slate-400'}`}>{m.status}</div>
                    </div>
                  ))}</div>
                )}
              </div>

              {detail.children?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-slate-200">Kids</h4>
                  <div className="space-y-2">{detail.children.map(k => (
                    <div key={k.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-sm font-medium text-slate-100">{k.child_name}</div>
                      <div className="text-xs text-slate-500">DOB {new Date(k.dob).toLocaleDateString('en-IN')} · Sports: {(k.selected_sports || []).map(sid => SPORTS.find(s => s.id === sid)?.name).join(', ')}</div>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={deactivate}>Deactivate</Button>
            <Button onClick={save} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Save className="w-4 h-4 mr-2" /> Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== ATTENDANCE =====================
function AttendanceSection() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [roster, setRoster] = useState([]);
  const [dirty, setDirty] = useState({});

  useEffect(() => { fetch('/api/admin/classes', { credentials: 'include' }).then(r => r.json()).then(d => setClasses(d.classes || [])); }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/admin/classes/${selectedClass}/roster`, { credentials: 'include' }).then(r => r.json()).then(d => { setRoster(d.roster || []); setDirty({}); });
  }, [selectedClass]);

  const toggle = (bid, val) => setDirty(prev => ({ ...prev, [bid]: val }));
  const markAll = (present) => { const d = {}; roster.forEach(r => { d[r.booking_id] = present; }); setDirty(d); };

  const save = async () => {
    const records = roster.map(r => ({ booking_id: r.booking_id, present: dirty[r.booking_id] !== undefined ? dirty[r.booking_id] : !!r.present }));
    const res = await fetch('/api/admin/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ class_id: selectedClass, records }) });
    if (res.ok) { toast.success(`Marked ${records.length} students`); setDirty({}); fetch(`/api/admin/classes/${selectedClass}/roster`, { credentials: 'include' }).then(r => r.json()).then(d => setRoster(d.roster || [])); }
    else toast.error('Failed');
  };

  return (
    <>
      <SectionHeader title="Attendance" description="Mark attendance for a scheduled class." />
      <div className="max-w-md mb-6">
        <Label className="text-slate-300 text-xs uppercase tracking-widest mb-1 block">Select class</Label>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Pick a class to mark attendance" /></SelectTrigger>
          <SelectContent>
            {classes.map(c => {
              const sport = SPORTS.find(s => s.id === c.sport_id);
              return <SelectItem key={c.id} value={c.id}>{sport?.name} · {c.date} · {c.start_time}–{c.end_time}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Button size="sm" variant="outline" onClick={() => markAll(true)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100"><CheckCircle2 className="w-4 h-4 mr-1 text-lime-400" /> All present</Button>
            <Button size="sm" variant="outline" onClick={() => markAll(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100"><XCircle className="w-4 h-4 mr-1" /> All absent</Button>
            <div className="flex-1" />
            <Button onClick={save} disabled={Object.keys(dirty).length === 0} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold disabled:opacity-40"><Save className="w-4 h-4 mr-1.5" />Save attendance</Button>
          </div>

          {roster.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No bookings for this class" />
          ) : (
            <Card className="rounded-lg bg-slate-900 border-slate-800 overflow-hidden">
              {roster.map(r => {
                const cur = dirty[r.booking_id] !== undefined ? dirty[r.booking_id] : r.present;
                return (
                  <div key={r.booking_id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm">{r.name[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-100 truncate">{r.name}</div>
                      <div className="text-xs text-slate-500 truncate">{r.subtitle}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => toggle(r.booking_id, true)} className={cur === true ? 'bg-lime-400 text-slate-900 hover:bg-lime-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}><CheckCircle2 className="w-4 h-4 mr-1" /> Present</Button>
                      <Button size="sm" onClick={() => toggle(r.booking_id, false)} className={cur === false ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}><XCircle className="w-4 h-4 mr-1" /> Absent</Button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}
    </>
  );
}

// ===================== PAYMENTS =====================
function PaymentsSection() {
  const [payments, setPayments] = useState([]);
  useEffect(() => { fetch('/api/admin/payments', { credentials: 'include' }).then(r => r.json()).then(d => setPayments(d.payments || [])); }, []);

  const total = payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const download = (p) => {
    const html = `<html><body style="font-family:Inter,sans-serif;padding:40px"><h1>Flowternity Invoice</h1><p>Ref: ${p.ref}</p><p>User: ${p.user_name} (${p.user_email})</p><p>Amount: ₹${p.amount.toLocaleString('en-IN')}</p><p>Status: ${p.status}</p><p>Date: ${new Date(p.created_at).toLocaleString('en-IN')}</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `invoice-${p.ref}.html`; a.click();
  };

  return (
    <>
      <SectionHeader title="Payments" description="All transactions and invoices." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={CreditCard} label="Total Collected" value={`₹${total.toLocaleString('en-IN')}`} tone="accent" />
        <StatCard icon={Activity} label="Transactions" value={payments.length} />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${payments.length ? Math.round(100 * payments.filter(p => p.status === 'success').length / payments.length) : 0}%`} />
      </div>
      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" />
      ) : (
        <Card className="rounded-lg bg-slate-900 border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Reference</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1 text-right">Invoice</div>
          </div>
          {payments.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
              <div className="col-span-12 md:col-span-4 min-w-0">
                <div className="font-medium text-slate-100 truncate">{p.user_name}</div>
                <div className="text-xs text-slate-500 truncate">{p.user_email}</div>
              </div>
              <div className="col-span-6 md:col-span-3 font-mono text-xs text-slate-400 truncate">{p.ref}</div>
              <div className="col-span-6 md:col-span-2 text-sm text-slate-300">{new Date(p.created_at).toLocaleDateString('en-IN')}</div>
              <div className="col-span-6 md:col-span-2">
                <div className="font-mono font-semibold text-slate-100">₹{p.amount.toLocaleString('en-IN')}</div>
                <div className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5 ${p.status === 'success' ? 'bg-lime-400/20 text-lime-400' : 'bg-slate-800 text-slate-400'}`}>{p.status}</div>
              </div>
              <div className="col-span-6 md:col-span-1 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => download(p)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100 h-8">Invoice</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

// ===================== COACHES =====================
function CoachesSection() {
  const [coaches, setCoaches] = useState([]);
  const [open, setOpen] = useState(false);
  const emptyForm = { full_name: '', email: '', phone: '', sports: [], bio: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => fetch('/api/admin/coaches', { credentials: 'include' }).then(r => r.json()).then(d => setCoaches(d.coaches || []));
  useEffect(() => { load(); }, []);

  const toggleSport = (id) => setForm(f => ({ ...f, sports: f.sports.includes(id) ? f.sports.filter(x => x !== id) : [...f.sports, id] }));

  const create = async (e, keepOpen) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/coaches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { toast.error('Failed'); return; }
    toast.success('Coach added');
    load();
    if (keepOpen) setForm(emptyForm);
    else { setForm(emptyForm); setOpen(false); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this coach?')) return;
    await fetch(`/api/admin/coaches/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <>
      <SectionHeader
        title="Coaches"
        description={`${coaches.length} coaches on the roster`}
        action={<Button onClick={() => setOpen(true)} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Plus className="w-4 h-4 mr-1.5" /> Add Coach</Button>}
      />

      {coaches.length === 0 ? (
        <EmptyState icon={UserCog} title="No coaches yet" cta="Add your first coach" onClick={() => setOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coaches.map(c => (
            <Card key={c.id} className="p-4 rounded-lg bg-slate-900 border-slate-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center font-bold flex-shrink-0">{c.full_name[0]?.toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-100 truncate">{c.full_name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.email}</div>
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {c.sports?.map(sid => <Badge key={sid} variant="secondary" className="bg-slate-800 text-slate-300 border-0 text-[10px]">{SPORTS.find(s => s.id === sid)?.name || sid}</Badge>)}
              </div>
              {c.bio && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{c.bio}</p>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-50">Add coach</DialogTitle></DialogHeader>
          <form onSubmit={(e) => create(e, false)} className="space-y-3">
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Full name</Label><Input required className="h-11 mt-1" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Email</Label><Input type="email" required className="h-11 mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Phone</Label><Input className="h-11 mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-widest mb-1 block">Assigned sports</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPORTS.filter(s => s.status === 'active').map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded border border-slate-700 bg-slate-950 cursor-pointer hover:border-slate-600">
                    <Checkbox checked={form.sports.includes(s.id)} onCheckedChange={() => toggleSport(s.id)} />
                    <span className="text-sm text-slate-200">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Bio</Label><Textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="One-liner about the coach" /></div>
            <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Plus className="w-4 h-4 mr-1.5" /> {saving ? 'Adding…' : 'Add coach'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== ANNOUNCEMENTS =====================
function AnnouncementsSection() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const emptyForm = { title: '', message: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => fetch('/api/admin/announcements', { credentials: 'include' }).then(r => r.json()).then(d => setList(d.announcements || []));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success('Posted'); setForm(emptyForm); setOpen(false); load(); }
    else toast.error('Failed');
  };

  const remove = async (id) => {
    if (!confirm('Delete announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <>
      <SectionHeader
        title="Announcements"
        description={`${list.length} published · shown on every member's dashboard`}
        action={<Button onClick={() => setOpen(true)} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Plus className="w-4 h-4 mr-1.5" /> New Announcement</Button>}
      />

      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" cta="Post your first announcement" onClick={() => setOpen(true)} />
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <Card key={a.id} className="p-4 rounded-lg bg-slate-900 border-slate-800 border-l-4 border-l-lime-400">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-100">{a.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{a.message}</p>
                  <p className="text-xs text-slate-500 mt-2">{new Date(a.created_at).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => remove(a.id)} className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-50">New announcement</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Title</Label><Input required className="h-11 mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Holiday closure notice" /></div>
            <div><Label className="text-slate-300 text-xs uppercase tracking-widest">Message</Label><Textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Details for members…" /></div>
            <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold"><Megaphone className="w-4 h-4 mr-1.5" /> {saving ? 'Posting…' : 'Post'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -------- Empty state --------
function EmptyState({ icon: Icon, title, cta, onClick }) {
  return (
    <Card className="p-12 rounded-lg bg-slate-900 border-slate-800 border-dashed text-center">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium">{title}</p>
      {cta && (
        <Button onClick={onClick} className="mt-4 bg-lime-400 text-slate-900 hover:bg-lime-300 font-semibold">
          <Plus className="w-4 h-4 mr-1.5" /> {cta}
        </Button>
      )}
    </Card>
  );
}
