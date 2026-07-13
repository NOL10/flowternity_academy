'use client';

import { useEffect, useState } from 'react';
import SiteNav from '@/components/site-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SPORTS } from '@/lib/flowternity/config';
import { Users } from 'lucide-react';

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coaches').then(r => r.json()).then(d => { setCoaches(d.coaches || []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-16 md:py-24">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Meet the</p>
        <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight">Coaches.</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl">A team of professional athletes and educators, ready to help you level up in every sport.</p>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4 mt-12">{[1,2,3].map(i => <div key={i} className="h-64 bg-secondary rounded-2xl animate-pulse" />)}</div>
        ) : coaches.length === 0 ? (
          <Card className="mt-12 p-12 rounded-3xl border-dashed text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-display font-bold text-2xl mt-4">Coaches coming soon</h3>
            <p className="text-muted-foreground mt-2">Our team is being onboarded. Check back shortly.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {coaches.map(c => (
              <Card key={c.id} className="p-6 rounded-3xl">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {c.photo_url ? <AvatarImage src={c.photo_url} /> : null}
                    <AvatarFallback className="bg-accent text-black font-black text-xl">{c.full_name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-display font-bold text-xl">{c.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{c.sports?.map(sid => SPORTS.find(s => s.id === sid)?.name || sid).join(' · ')}</p>
                  </div>
                </div>
                {c.bio && <p className="text-sm text-muted-foreground mt-4">{c.bio}</p>}
                <div className="flex flex-wrap gap-1 mt-4">
                  {c.sports?.map(sid => <Badge key={sid} variant="secondary">{SPORTS.find(s => s.id === sid)?.name || sid}</Badge>)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
