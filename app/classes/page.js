'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { SPORTS } from '@/lib/flowternity/config';
import { Clock, User, Users, Check } from 'lucide-react';

export default function ClassesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState([]);
  const [sport, setSport] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const load = async () => {
    setLoadingList(true);
    const url = sport === 'all' ? '/api/classes' : `/api/classes?sport=${sport}`;
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setClasses(d.classes || []); }
    setLoadingList(false);
  };

  useEffect(() => { load(); }, [sport]);

  const book = async (id) => {
    if (!user) { router.push('/auth?mode=login&next=/classes'); return; }
    setBusyId(id);
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ class_id: id }) });
    const d = await res.json();
    if (res.ok) { toast.success('Class booked! See you there.'); load(); }
    else toast.error(d.error || 'Booking failed');
    setBusyId(null);
  };

  const groupedByDate = classes.reduce((acc, c) => { (acc[c.date] = acc[c.date] || []).push(c); return acc; }, {});
  const activeSports = SPORTS.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-10 md:py-14">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Classes</p>
        <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight">Book your slot.</h1>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mt-8">
          <button onClick={() => setSport('all')} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${sport === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}>All Sports</button>
          {activeSports.map(s => (
            <button key={s.id} onClick={() => setSport(s.id)} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${sport === s.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}>{s.name}</button>
          ))}
        </div>

        {loadingList ? (
          <div className="mt-10 space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-2xl" />)}</div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <Card className="mt-10 p-12 rounded-3xl border-dashed text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-display font-bold text-2xl mt-4">No classes scheduled yet</h3>
            <p className="text-muted-foreground mt-2">Check back soon — our coaches are scheduling new sessions.</p>
            {user?.role === 'admin' && <Link href="/admin"><Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Create a Class (Admin)</Button></Link>}
          </Card>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(groupedByDate).map(([date, list]) => (
              <div key={date}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="font-display font-black text-3xl">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long' })}</h2>
                  <span className="text-muted-foreground">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {list.map(c => {
                    const isFull = c.booked_count >= c.capacity;
                    return (
                      <Card key={c.id} className={`p-6 rounded-2xl ${c.is_booked ? 'border-2 border-accent' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{c.sport?.name || c.sport_id}</Badge>
                              {c.is_booked && <Badge className="bg-accent text-black hover:bg-accent">Booked</Badge>}
                              {isFull && !c.is_booked && <Badge variant="destructive">Full</Badge>}
                            </div>
                            <h3 className="font-display font-bold text-xl mt-2">{c.sport?.name || c.sport_id} session</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.start_time} – {c.end_time}</span>
                              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {c.coach_name}</span>
                              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.booked_count}/{c.capacity}</span>
                            </div>
                          </div>
                          {c.is_booked ? (
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent"><Check className="w-5 h-5 text-black" /></div>
                          ) : (
                            <Button onClick={() => book(c.id)} disabled={busyId === c.id || isFull} className="bg-primary text-primary-foreground hover:bg-primary/90">
                              {busyId === c.id ? 'Booking...' : isFull ? 'Full' : 'Book'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
