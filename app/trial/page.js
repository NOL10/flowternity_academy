'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SPORTS } from '@/lib/flowternity/config';
import { toast } from 'sonner';
import { Sparkles, Check, ArrowRight, CalendarCheck2, Loader2, Info } from 'lucide-react';

function TrialInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialSport = params.get('sport');
  const activeSports = SPORTS.filter(s => s.status === 'active');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    sport_id: initialSport && activeSports.find(s => s.id === initialSport) ? initialSport : (activeSports[0]?.id || ''),
    class_id: '',
    message: '',
  });
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!form.sport_id) { setClasses([]); return; }
    setLoadingClasses(true);
    fetch(`/api/trial/classes?sport=${encodeURIComponent(form.sport_id)}`)
      .then(r => r.json())
      .then(d => setClasses((d.classes || []).slice(0, 12)))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, [form.sport_id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.sport_id) {
      toast.error('Name, email, phone, sport required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/trial/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data);
      toast.success('Your free class is booked!');
    } catch (e) {
      toast.error(e.message || 'Failed to book. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="container py-16 md:py-24 max-w-2xl">
          <Card className="p-10 rounded-3xl border-2 border-accent bg-accent/10">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6">
              <CalendarCheck2 className="w-8 h-8 text-black" />
            </div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Booking confirmed</p>
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">You&apos;re in!</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {success.class
                ? `See you at ${success.class.start_time} on ${new Date(success.class.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                : 'Our team will call you within 24 hours to confirm your free class slot.'}
            </p>
            {success.class && (
              <div className="mt-6 p-4 rounded-xl bg-background border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Your slot</p>
                <p className="font-display font-bold text-2xl mt-1">{SPORTS.find(s => s.id === success.class.sport_id)?.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(success.class.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {success.class.start_time}–{success.class.end_time} · Coach {success.class.coach_name}
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/memberships"><Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12">Explore memberships <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              <Link href="/"><Button variant="outline" className="h-12">Back to home</Button></Link>
            </div>
            {success.email_sent ? (
              <p className="mt-4 text-xs text-muted-foreground">✓ Confirmation sent to your email.</p>
            ) : success.class ? (
              <p className="mt-4 text-xs text-muted-foreground">Email confirmation delivery pending — our team will call to confirm.</p>
            ) : null}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <Badge className="bg-accent text-black hover:bg-accent mb-4"><Sparkles className="w-3 h-3 mr-1" /> One free class · No card needed</Badge>
          <h1 className="font-display font-black text-5xl md:text-6xl tracking-tight text-balance">Try before you commit.</h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            Come in for a free trial class in the sport of your choice. No account, no payment — just show up and play.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-3">
            <Card className="p-6 md:p-8 rounded-3xl">
              <form onSubmit={submit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><Label>Full name</Label><Input required className="h-12 mt-1" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Rahul Sharma" /></div>
                  <div><Label>Email</Label><Input required type="email" className="h-12 mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div>
                  <div><Label>Phone</Label><Input required type="tel" className="h-12 mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98xxxx" /></div>
                </div>

                <div>
                  <Label className="mb-2 block">Pick a sport</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeSports.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm({ ...form, sport_id: s.id, class_id: '' })}
                        className={`p-3 rounded-xl border text-left transition text-sm ${form.sport_id === s.id ? 'border-primary bg-secondary' : 'hover:border-primary/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{s.name}</span>
                          {form.sport_id === s.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.tagline}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Pick a slot (optional)</Label>
                  {loadingClasses ? (
                    <div className="p-4 rounded-xl border text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading available classes…</div>
                  ) : classes.length === 0 ? (
                    <div className="p-4 rounded-xl border text-sm text-muted-foreground flex items-center gap-2"><Info className="w-4 h-4" /> No upcoming classes yet. Submit and our team will call you.</div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, class_id: '' })}
                        className={`p-3 rounded-xl border text-left transition text-sm ${!form.class_id ? 'border-primary bg-secondary' : 'hover:border-primary/50'}`}
                      >
                        <div className="font-semibold">Call me to schedule</div>
                        <p className="text-xs text-muted-foreground mt-0.5">Our team will find a good slot.</p>
                      </button>
                      {classes.map(c => {
                        const dt = new Date(c.date);
                        const disabled = c.seats_left <= 0;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setForm({ ...form, class_id: c.id })}
                            className={`p-3 rounded-xl border text-left transition text-sm relative ${form.class_id === c.id ? 'border-primary bg-secondary' : 'hover:border-primary/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                              {form.class_id === c.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.start_time}–{c.end_time} · {c.coach_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{c.seats_left} seat{c.seats_left === 1 ? '' : 's'} left</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Anything we should know? <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Textarea className="mt-1" rows={2} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="I'm a total beginner, I have a knee injury, etc." />
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-14 bg-accent text-black hover:bg-accent/90 text-base font-semibold">
                  {submitting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Booking your slot…</>) : (<>Book my free class <ArrowRight className="w-5 h-5 ml-2" /></>)}
                </Button>
                <p className="text-xs text-muted-foreground text-center">No card required. One free class per person per month.</p>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 rounded-3xl bg-primary text-primary-foreground">
              <h3 className="font-display font-bold text-2xl">What you get</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5" /> One full class, on the house</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5" /> Meet the coach and try the facility</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5" /> No card, no commitment</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5" /> Special new-member offer after your trial</li>
              </ul>
            </Card>

            <Card className="p-6 rounded-3xl">
              <h3 className="font-display font-bold text-xl">How it works</h3>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li><span className="font-semibold text-foreground">1.</span> Pick a sport & (optionally) a slot.</li>
                <li><span className="font-semibold text-foreground">2.</span> We confirm by email or a quick call.</li>
                <li><span className="font-semibold text-foreground">3.</span> Show up 10 minutes early with sports gear.</li>
                <li><span className="font-semibold text-foreground">4.</span> Loved it? Grab a membership on the way out.</li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrialPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><TrialInner /></Suspense>;
}
