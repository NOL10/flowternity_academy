'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { SPORTS } from '@/lib/flowternity/config';
import { Trash2, Plus, Users, Calendar, Activity, Sparkles, Search, CreditCard, Megaphone, UserCog, ClipboardList, CheckCircle2, XCircle, Save } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/auth?mode=login&next=/admin'); return; }
      if (user.role !== 'admin') { toast.error('Admin only'); router.push('/dashboard'); return; }
      fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()).then(setStats);
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return <div className="min-h-screen bg-background"><SiteNav /></div>;

  const cards = [
    { icon: Users, label: 'Total Users', v: stats?.total_users ?? 0 },
    { icon: Sparkles, label: 'Active Memberships', v: stats?.active_memberships ?? 0 },
    { icon: Calendar, label: "Today's Classes", v: stats?.today_classes ?? 0 },
    { icon: Activity, label: 'Active Bookings', v: stats?.active_bookings ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-10 md:py-14">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Admin</p>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">Command Center</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {cards.map((s, i) => (
            <Card key={i} className="p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display font-black text-4xl mt-2">{s.v}</div>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="w-full flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="overview"><ClipboardList className="w-4 h-4 mr-2" />Classes</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" />Members</TabsTrigger>
            <TabsTrigger value="attendance"><CheckCircle2 className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-2" />Payments</TabsTrigger>
            <TabsTrigger value="coaches"><UserCog className="w-4 h-4 mr-2" />Coaches</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="w-4 h-4 mr-2" />Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6"><ClassesTab /></TabsContent>
          <TabsContent value="members" className="mt-6"><MembersTab /></TabsContent>
          <TabsContent value="attendance" className="mt-6"><AttendanceTab /></TabsContent>
          <TabsContent value="payments" className="mt-6"><PaymentsTab /></TabsContent>
          <TabsContent value="coaches" className="mt-6"><CoachesTab /></TabsContent>
          <TabsContent value="announcements" className="mt-6"><AnnouncementsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------- CLASSES TAB ----------------
function ClassesTab() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ sport_id: 'basketball', coach_name: '', date: '', start_time: '', end_time: '', capacity: 12 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const c = await fetch('/api/admin/classes', { credentials: 'include' }).then(r => r.json());
    setClasses(c.classes || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    const d = await res.json();
    if (res.ok) { toast.success('Class created'); setForm({ ...form, date: '', start_time: '', end_time: '' }); load(); } else toast.error(d.error);
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm('Delete this class? All bookings will be cancelled.')) return;
    const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { toast.success('Deleted'); load(); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 rounded-2xl">
        <h2 className="font-display font-bold text-2xl mb-1">Create Class</h2>
        <p className="text-sm text-muted-foreground mb-4">Add a new class for members to book.</p>
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label>Sport</Label>
            <Select value={form.sport_id} onValueChange={v => setForm({ ...form, sport_id: v })}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPORTS.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Coach Name</Label><Input required className="h-11 mt-1" value={form.coach_name} onChange={e => setForm({ ...form, coach_name: e.target.value })} placeholder="Coach Ravi" /></div>
          <div><Label>Date</Label><Input type="date" required className="h-11 mt-1" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input type="time" required className="h-11 mt-1" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
            <div><Label>End</Label><Input type="time" required className="h-11 mt-1" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
          </div>
          <div><Label>Capacity</Label><Input type="number" min="1" required className="h-11 mt-1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
          <Button disabled={saving} type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> {saving ? 'Creating...' : 'Create Class'}</Button>
        </form>
      </Card>

      <div className="lg:col-span-2">
        <h2 className="font-display font-bold text-2xl mb-4">All Classes</h2>
        {classes.length === 0 ? (
          <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No classes yet.</Card>
        ) : (
          <div className="space-y-2">
            {classes.map(c => {
              const sport = SPORTS.find(s => s.id === c.sport_id);
              return (
                <Card key={c.id} className="p-4 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-muted-foreground">{new Date(c.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="font-display font-black">{new Date(c.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{sport?.name}</span>
                      <Badge variant="secondary" className="text-xs">{c.start_time}–{c.end_time}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{c.coach_name} · Cap {c.capacity}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- MEMBERS TAB ----------------
function MembersTab() {
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

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

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name, email, phone" value={q} onChange={e => setQ(e.target.value)} className="h-11 pl-9" /></div>
      </div>
      {members.length === 0 ? (
        <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No members found.</Card>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <Card key={m.id} className="p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-black">{m.full_name?.[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold truncate">{m.full_name}</span><Badge variant="secondary" className="capitalize text-xs">{m.role}</Badge>{m.status === 'inactive' && <Badge variant="destructive" className="text-xs">Inactive</Badge>}</div>
                <div className="text-xs text-muted-foreground truncate">{m.email} · {m.phone || '—'}</div>
              </div>
              <div className="text-right hidden sm:block">
                {m.latest_membership ? (
                  <>
                    <Badge className={m.latest_membership.status === 'active' ? 'bg-accent text-black hover:bg-accent' : ''} variant={m.latest_membership.status === 'active' ? 'default' : 'secondary'}>{m.latest_membership.status}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{m.latest_membership.membership_snapshot?.name}</div>
                  </>
                ) : <span className="text-xs text-muted-foreground">No membership</span>}
              </div>
              <Button variant="outline" size="sm" onClick={() => openDetail(m)}>View</Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={o => { if (!o) { setSelected(null); setDetail(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.full_name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input className="h-11 mt-1" value={detail.user.full_name || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, full_name: e.target.value } })} /></div>
                <div><Label>Phone</Label><Input className="h-11 mt-1" value={detail.user.phone || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, phone: e.target.value } })} /></div>
                <div className="col-span-2"><Label>Address</Label><Textarea value={detail.user.address || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, address: e.target.value } })} /></div>
                <div className="col-span-2"><Label>Emergency Contact</Label><Input className="h-11 mt-1" value={detail.user.emergency_contact || ''} onChange={e => setDetail({ ...detail, user: { ...detail.user, emergency_contact: e.target.value } })} /></div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Memberships</h4>
                {detail.memberships.length === 0 ? <p className="text-sm text-muted-foreground">None</p> : (
                  <div className="space-y-2">{detail.memberships.map(m => (
                    <div key={m.id} className="p-3 rounded-lg bg-secondary flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{m.membership_snapshot?.name} · {m.membership_snapshot?.duration_months}M</div>
                        <div className="text-xs text-muted-foreground">Expires {new Date(m.expiry_date).toLocaleDateString('en-IN')}</div>
                      </div>
                      <Badge className={m.status === 'active' ? 'bg-accent text-black hover:bg-accent' : ''} variant={m.status === 'active' ? 'default' : 'secondary'}>{m.status}</Badge>
                    </div>
                  ))}</div>
                )}
              </div>

              {detail.children?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Kids</h4>
                  <div className="space-y-2">{detail.children.map(k => (
                    <div key={k.id} className="p-3 rounded-lg bg-secondary">
                      <div className="text-sm font-medium">{k.child_name}</div>
                      <div className="text-xs text-muted-foreground">DOB {new Date(k.dob).toLocaleDateString('en-IN')} · Sports: {(k.selected_sports || []).map(sid => SPORTS.find(s => s.id === sid)?.name).join(', ')}</div>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={deactivate}>Deactivate</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------- ATTENDANCE TAB ----------------
function AttendanceTab() {
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

  const save = async () => {
    const records = roster.map(r => ({ booking_id: r.booking_id, present: dirty[r.booking_id] !== undefined ? dirty[r.booking_id] : !!r.present }));
    const res = await fetch('/api/admin/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ class_id: selectedClass, records }) });
    if (res.ok) { toast.success(`Marked ${records.length} students`); setDirty({}); fetch(`/api/admin/classes/${selectedClass}/roster`, { credentials: 'include' }).then(r => r.json()).then(d => setRoster(d.roster || [])); }
    else toast.error('Failed');
  };

  const markAll = (present) => {
    const d = {};
    roster.forEach(r => { d[r.booking_id] = present; });
    setDirty(d);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <Label className="mb-1 block">Select class</Label>
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
      </div>

      {selectedClass && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={() => markAll(true)}><CheckCircle2 className="w-4 h-4 mr-1 text-accent-foreground" />Mark all Present</Button>
            <Button size="sm" variant="outline" onClick={() => markAll(false)}><XCircle className="w-4 h-4 mr-1" />Mark all Absent</Button>
            <div className="flex-1" />
            <Button onClick={save} disabled={Object.keys(dirty).length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90"><Save className="w-4 h-4 mr-2" />Save Attendance</Button>
          </div>

          {roster.length === 0 ? (
            <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No bookings for this class.</Card>
          ) : (
            <div className="space-y-2">
              {roster.map(r => {
                const cur = dirty[r.booking_id] !== undefined ? dirty[r.booking_id] : r.present;
                return (
                  <Card key={r.booking_id} className="p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">{r.name[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant={cur === true ? 'default' : 'outline'} className={cur === true ? 'bg-accent text-black hover:bg-accent/90' : ''} onClick={() => toggle(r.booking_id, true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Present</Button>
                      <Button size="sm" variant={cur === false ? 'destructive' : 'outline'} onClick={() => toggle(r.booking_id, false)}><XCircle className="w-4 h-4 mr-1" /> Absent</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- PAYMENTS TAB ----------------
function PaymentsTab() {
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
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 rounded-2xl"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Collected</p><div className="font-display font-black text-3xl mt-1">₹{total.toLocaleString('en-IN')}</div></Card>
        <Card className="p-5 rounded-2xl"><p className="text-xs uppercase tracking-widest text-muted-foreground">Transactions</p><div className="font-display font-black text-3xl mt-1">{payments.length}</div></Card>
        <Card className="p-5 rounded-2xl"><p className="text-xs uppercase tracking-widest text-muted-foreground">Success Rate</p><div className="font-display font-black text-3xl mt-1">{payments.length ? Math.round(100 * payments.filter(p => p.status === 'success').length / payments.length) : 0}%</div></Card>
      </div>
      {payments.length === 0 ? (
        <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No payments yet.</Card>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <Card key={p.id} className="p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.user_name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.ref} · {new Date(p.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{p.amount.toLocaleString('en-IN')}</div>
                <Badge variant="secondary" className="text-xs">{p.status}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => download(p)}>Invoice</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- COACHES TAB ----------------
function CoachesTab() {
  const [coaches, setCoaches] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', sports: [], bio: '' });

  const load = () => fetch('/api/admin/coaches', { credentials: 'include' }).then(r => r.json()).then(d => setCoaches(d.coaches || []));
  useEffect(() => { load(); }, []);

  const toggleSport = (id) => setForm(f => ({ ...f, sports: f.sports.includes(id) ? f.sports.filter(x => x !== id) : [...f.sports, id] }));

  const create = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/coaches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    if (res.ok) { toast.success('Coach added'); setForm({ full_name: '', email: '', phone: '', sports: [], bio: '' }); load(); }
    else toast.error('Failed');
  };

  const remove = async (id) => {
    if (!confirm('Remove this coach?')) return;
    await fetch(`/api/admin/coaches/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 rounded-2xl">
        <h2 className="font-display font-bold text-2xl mb-1">Add Coach</h2>
        <p className="text-sm text-muted-foreground mb-4">Coaches appear on the public /coaches page.</p>
        <form onSubmit={create} className="space-y-3">
          <div><Label>Full Name</Label><Input required className="h-11 mt-1" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" required className="h-11 mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input className="h-11 mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <Label className="mb-1 block">Assigned Sports</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.filter(s => s.status === 'active').map(s => (
                <label key={s.id} className="flex items-center gap-2 p-2 rounded border cursor-pointer">
                  <Checkbox checked={form.sports.includes(s.id)} onCheckedChange={() => toggleSport(s.id)} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="One-liner about the coach" /></div>
          <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Add Coach</Button>
        </form>
      </Card>

      <div className="lg:col-span-2">
        <h2 className="font-display font-bold text-2xl mb-4">All Coaches</h2>
        {coaches.length === 0 ? (
          <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No coaches yet.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {coaches.map(c => (
              <Card key={c.id} className="p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-black">{c.full_name[0]?.toUpperCase()}</div>
                    <div>
                      <div className="font-semibold">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.sports?.map(sid => <Badge key={sid} variant="secondary" className="text-xs">{SPORTS.find(s => s.id === sid)?.name || sid}</Badge>)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- ANNOUNCEMENTS TAB ----------------
function AnnouncementsTab() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });

  const load = () => fetch('/api/admin/announcements', { credentials: 'include' }).then(r => r.json()).then(d => setList(d.announcements || []));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    if (res.ok) { toast.success('Posted'); setForm({ title: '', message: '' }); load(); }
  };

  const remove = async (id) => {
    if (!confirm('Delete announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 rounded-2xl">
        <h2 className="font-display font-bold text-2xl mb-1">New Announcement</h2>
        <p className="text-sm text-muted-foreground mb-4">Shown on every member&apos;s dashboard.</p>
        <form onSubmit={create} className="space-y-3">
          <div><Label>Title</Label><Input required className="h-11 mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Holiday closure notice" /></div>
          <div><Label>Message</Label><Textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Details for members..." /></div>
          <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Megaphone className="w-4 h-4 mr-2" /> Post</Button>
        </form>
      </Card>

      <div className="lg:col-span-2">
        <h2 className="font-display font-bold text-2xl mb-4">Published</h2>
        {list.length === 0 ? (
          <Card className="p-8 rounded-2xl border-dashed text-center text-muted-foreground">No announcements yet.</Card>
        ) : (
          <div className="space-y-3">
            {list.map(a => (
              <Card key={a.id} className="p-5 rounded-2xl border-l-4 border-l-accent">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
