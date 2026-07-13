'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { Calendar, Clock, MapPin, User, Pause, PlayCircle, RefreshCw, CreditCard, Trophy, Sparkles, X } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState(30);
  const [loadingData, setLoadingData] = useState(true);

  const load = async () => {
    setLoadingData(true);
    const res = await fetch('/api/dashboard', { credentials: 'include' });
    if (res.ok) setData(await res.json());
    setLoadingData(false);
  };

  useEffect(() => {
    if (!loading && !user) router.push('/auth?mode=login&next=/dashboard');
    if (user) load();
  }, [user, loading, router]);

  const cancelBooking = async (id) => {
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST', credentials: 'include' });
    if (res.ok) { toast.success('Booking cancelled'); load(); } else toast.error('Failed');
  };

  const pauseMembership = async () => {
    const res = await fetch('/api/memberships/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ days: pauseDays }) });
    const d = await res.json();
    if (res.ok) { toast.success('Membership paused'); setPauseOpen(false); load(); } else toast.error(d.error);
  };

  const resume = async () => {
    const res = await fetch('/api/memberships/resume', { method: 'POST', credentials: 'include' });
    if (res.ok) { toast.success('Membership resumed — expiry extended'); load(); } else toast.error('Failed');
  };

  if (loading || loadingData) return (
    <div className="min-h-screen bg-background"><SiteNav /><div className="container py-20"><div className="animate-pulse space-y-4"><div className="h-8 bg-secondary w-1/3 rounded" /><div className="h-40 bg-secondary rounded-2xl" /></div></div></div>
  );

  const m = data?.active_membership;
  const daysLeft = m ? Math.max(0, Math.ceil((new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const totalDays = m ? (m.membership_snapshot?.duration_months || 1) * 30 : 30;
  const pct = m ? Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-10 md:py-14">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Dashboard</p>
            <h1 className="font-display font-black text-4xl md:text-5xl mt-1">Hello, {user?.full_name?.split(' ')[0]} <span className="inline-block ml-1"><Sparkles className="w-8 h-8 inline text-accent" /></span></h1>
          </div>
          <div className="hidden md:flex gap-2">
            <Link href="/classes"><Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Calendar className="w-4 h-4 mr-2" /> Book a Class</Button></Link>
          </div>
        </div>

        {/* Membership card */}
        {m ? (
          <Card className="p-6 md:p-8 rounded-3xl bg-primary text-primary-foreground border-0 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  <span className="text-sm uppercase tracking-widest text-white/60">{m.membership_snapshot?.category === 'kids' ? 'Kids Elite' : 'Adult Elite'}</span>
                  <Badge className={`${m.status === 'active' ? 'bg-accent text-black' : 'bg-white/20 text-white'} hover:bg-accent`}>{m.status}</Badge>
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl mt-2">{m.membership_snapshot?.duration_months} {m.membership_snapshot?.duration_months === 1 ? 'Month' : 'Months'}</h2>
                <p className="text-white/60 mt-2 text-sm">Expires on {new Date(m.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-white/60 mb-2"><span>{daysLeft} days remaining</span><span>{Math.round(pct)}%</span></div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {m.status === 'active' && <Button onClick={() => setPauseOpen(true)} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-11"><Pause className="w-4 h-4 mr-2" /> Pause</Button>}
                {m.status === 'paused' && <Button onClick={resume} className="bg-accent text-black hover:bg-accent/90 h-11"><PlayCircle className="w-4 h-4 mr-2" /> Resume</Button>}
                <Link href="/memberships"><Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-11"><RefreshCw className="w-4 h-4 mr-2" /> Renew</Button></Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 rounded-3xl bg-accent border-0">
            <h2 className="font-display font-black text-3xl text-black">No active membership.</h2>
            <p className="text-black/70 mt-2">Pick a plan to start booking classes.</p>
            <Link href="/memberships"><Button className="mt-4 bg-black text-white hover:bg-black/90 h-12">Choose Plan</Button></Link>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {/* Upcoming classes */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-2xl">Upcoming Classes</h3>
              <Link href="/classes" className="text-sm underline">Browse all</Link>
            </div>
            {data?.upcoming_classes?.length ? (
              <div className="space-y-3">
                {data.upcoming_classes.map(uc => (
                  <Card key={uc.booking_id} className="p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground uppercase">{new Date(uc.class.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      <span className="font-display font-black text-xl">{new Date(uc.class.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{uc.sport_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{uc.class.start_time} – {uc.class.end_time}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{uc.class.coach_name}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancelBooking(uc.booking_id)}><X className="w-4 h-4" /></Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 rounded-2xl text-center border-dashed">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No upcoming classes.</p>
                <Link href="/classes"><Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">Book Your First Class</Button></Link>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-bold text-2xl mb-4">Recent Payments</h3>
              {data?.payments?.length ? (
                <Card className="rounded-2xl divide-y">
                  {data.payments.map(p => (
                    <div key={p.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.ref}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{p.amount.toLocaleString('en-IN')}</div>
                        <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </Card>
              ) : <Card className="p-4 text-sm text-muted-foreground rounded-2xl">No payments yet.</Card>}
            </div>

            {data?.announcements?.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-2xl mb-4">Announcements</h3>
                <div className="space-y-3">
                  {data.announcements.map(a => (
                    <Card key={a.id} className="p-4 rounded-2xl border-l-4 border-l-accent">
                      <div className="font-semibold">{a.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pause your membership</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Your membership expiry will be extended by the paused duration. Standard pause is 30 days, and you can only pause once per membership.</p>
          <div>
            <Label>Pause duration (days, max 30)</Label>
            <Input type="number" min="1" max="30" value={pauseDays} onChange={e => setPauseDays(e.target.value)} className="mt-1 h-12" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)}>Cancel</Button>
            <Button onClick={pauseMembership} className="bg-primary text-primary-foreground hover:bg-primary/90">Pause</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
