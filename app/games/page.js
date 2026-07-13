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
import { Users, Clock, MapPin, ArrowRight, Zap, Flame } from 'lucide-react';

export default function GamesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [sport, setSport] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    const url = sport === 'all' ? '/api/games' : `/api/games?sport=${sport}`;
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setGames(d.games || []); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sport]);

  const join = async (gameId) => {
    if (!user) { router.push(`/auth?mode=login&next=/games`); return; }
    setBusy(gameId);
    const res = await fetch(`/api/games/${gameId}/join`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    if (res.ok) { toast.success('You\'re in! See you on the court.'); load(); }
    else toast.error(d.error || 'Failed to join');
    setBusy(null);
  };

  const leave = async (gameId) => {
    setBusy(gameId);
    const res = await fetch(`/api/games/${gameId}/leave`, { method: 'POST', credentials: 'include' });
    if (res.ok) { toast.success('You left the game'); load(); }
    setBusy(null);
  };

  const activeSports = SPORTS.filter(s => s.status === 'active');
  const groupedByDate = games.reduce((acc, g) => { (acc[g.date] = acc[g.date] || []).push(g); return acc; }, {});

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container">
          <Badge className="bg-accent text-black hover:bg-accent mb-6"><Flame className="w-3 h-3 mr-1" /> Community Games</Badge>
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight leading-[0.95]">Join a Game.<br /><span className="text-accent">Meet the crew.</span></h1>
          <p className="text-white/70 text-lg mt-6 max-w-2xl">Show up. Play. Leave with new friends. We handle the equipment, the players, and the court. You just bring the energy.</p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10 max-w-3xl">
            {[
              { n: '1', t: 'Pick a slot', d: 'Choose a game that fits your schedule' },
              { n: '2', t: 'We handle setup', d: 'Equipment, players, court — done' },
              { n: '3', t: 'Show up & play', d: 'Meet new players. Have fun.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"><span className="text-black font-black">{s.n}</span></div>
                <div><h3 className="font-semibold">{s.t}</h3><p className="text-white/60 text-sm mt-1">{s.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-12 md:py-16">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSport('all')} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${sport === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}>All Sports</button>
          {activeSports.map(s => (
            <button key={s.id} onClick={() => setSport(s.id)} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${sport === s.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}>{s.name}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-secondary animate-pulse rounded-2xl" />)}</div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <Card className="p-12 rounded-3xl border-dashed text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-display font-bold text-2xl mt-4">No games scheduled yet</h3>
            <p className="text-muted-foreground mt-2">Check back soon — new pickup games drop every week.</p>
            {user?.role === 'admin' && <Link href="/admin"><Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Schedule a Game (Admin)</Button></Link>}
          </Card>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByDate).map(([date, list]) => (
              <div key={date}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="font-display font-black text-3xl">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long' })}</h2>
                  <span className="text-muted-foreground">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {list.map(g => {
                    const isFull = g.participants_count >= g.max_players;
                    return (
                      <Card key={g.id} className={`p-6 rounded-2xl ${g.i_joined ? 'border-2 border-accent' : ''}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">{g.sport?.name || g.sport_id}</Badge>
                              <Badge variant="outline" className="text-xs capitalize">{g.skill_level?.replace('_', ' ')}</Badge>
                              {g.i_joined && <Badge className="bg-accent text-black hover:bg-accent">You&apos;re in</Badge>}
                              {isFull && !g.i_joined && <Badge variant="destructive">Full</Badge>}
                            </div>
                            <h3 className="font-display font-bold text-2xl mt-2">{g.title}</h3>
                            {g.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display font-black text-2xl">{g.participants_count}<span className="text-muted-foreground text-lg">/{g.max_players}</span></div>
                            <div className="text-xs text-muted-foreground">players</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-3">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {g.start_time} – {g.end_time}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Hosted by {g.host_name}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link href={`/games/${g.id}`} className="flex-1"><Button variant="outline" className="w-full">View <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
                          {g.i_joined ? (
                            <Button onClick={() => leave(g.id)} disabled={busy === g.id} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">Leave</Button>
                          ) : (
                            <Button onClick={() => join(g.id)} disabled={busy === g.id || isFull} className="bg-accent text-black hover:bg-accent/90">{busy === g.id ? 'Joining...' : isFull ? 'Full' : 'Join Game'}</Button>
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

        {!user && (
          <Card className="mt-12 p-8 rounded-3xl bg-accent border-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display font-black text-3xl text-black flex items-center gap-2"><Zap className="w-7 h-7" /> Sign up to play</h3>
                <p className="text-black/70 mt-1">You need an active membership to join a game.</p>
              </div>
              <Link href="/memberships"><Button size="lg" className="bg-black text-white hover:bg-black/90 h-12 px-8">Get Membership</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
