'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/app/providers';
import { MEMBERSHIPS, SPORTS } from '@/lib/flowternity/config';
import { toast } from 'sonner';
import { Check, CreditCard, Loader2, Lock, User, Baby, ShieldCheck, Info } from 'lucide-react';

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const planId = params.get('plan');
  const plan = MEMBERSHIPS.find(m => m.id === planId);
  const isKids = plan?.category === 'kids';

  const [processing, setProcessing] = useState(false);
  const [account, setAccount] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [child, setChild] = useState({ child_name: '', dob: '', gender: '' });
  const [selectedSports, setSelectedSports] = useState([]);

  useEffect(() => {
    if (user) {
      setAccount(a => ({ ...a, full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' }));
    }
  }, [user]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="container py-20 text-center">
          <h1 className="font-display font-black text-3xl">Plan not found</h1>
          <Link href="/memberships" className="mt-4 inline-block underline">Back to memberships</Link>
        </div>
      </div>
    );
  }

  const activeSports = SPORTS.filter(s => s.status === 'active');

  const toggleSport = (id) => {
    setSelectedSports(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (isKids && prev.length >= 2) { toast.error('Max 2 sports for kids'); return prev; }
      return [...prev, id];
    });
  };

  const validate = () => {
    if (!user) {
      if (!account.full_name.trim()) return 'Full name is required';
      if (!account.email.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) return 'Enter a valid email';
      if (!account.phone.trim()) return 'Phone number is required';
      if (account.password.length < 6) return 'Password must be at least 6 characters';
      if (account.password !== account.confirm) return 'Passwords do not match';
    }
    if (isKids) {
      if (!child.child_name.trim()) return 'Child name is required';
      if (!child.dob) return 'Child DOB is required';
      if (selectedSports.length === 0) return 'Pick at least 1 sport for the kid';
    }
    return null;
  };

  const pay = async () => {
    const problem = validate();
    if (problem) { toast.error(problem); return; }

    setProcessing(true);
    try {
      // simulate payment gateway
      await new Promise(r => setTimeout(r, 1200));

      if (user) {
        // Already signed in — just add membership via existing mock checkout
        let child_profile_id = null;
        if (isKids) {
          const cres = await fetch('/api/children', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ ...child, selected_sports: selectedSports })
          });
          const cdata = await cres.json();
          if (!cres.ok) throw new Error(cdata.error);
          child_profile_id = cdata.child.id;
        }
        const res = await fetch('/api/checkout/mock', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({
            membership_id: plan.id,
            child_profile_id,
            selected_sports: isKids ? selectedSports : selectedSports,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        // Register + pay in one call
        const payload = {
          full_name: account.full_name,
          email: account.email,
          phone: account.phone,
          password: account.password,
          role: isKids ? 'parent' : 'adult',
          membership_id: plan.id,
          selected_sports: selectedSports,
        };
        if (isKids) payload.child = child;

        const res = await fetch('/api/checkout/register-and-pay', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          // If email already exists, guide the user
          if (res.status === 409) {
            toast.error(data.error);
            setTimeout(() => router.push(`/auth?mode=login&next=/checkout?plan=${plan.id}`), 800);
            setProcessing(false);
            return;
          }
          throw new Error(data.error);
        }
      }

      toast.success('Payment successful! Welcome to Flowternity.');
      await refresh();
      router.push('/dashboard?welcome=1');
    } catch (e) {
      toast.error(e.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const perMonth = Math.round(plan.price / plan.duration_months);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-10 md:py-14 max-w-6xl">
        <div className="mb-8">
          <Link href="/memberships" className="text-sm text-muted-foreground hover:text-foreground transition">← Back to plans</Link>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mt-4 mb-2">Checkout</p>
          <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">Complete your membership</h1>
          <p className="text-muted-foreground mt-3">
            {user
              ? `Signed in as ${user.full_name}. Just confirm details & pay.`
              : `Create your account and activate your membership in one step.`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Progress hint */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">1</span> Details</span>
              <span className="flex-1 h-px bg-border" />
              <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">2</span> Payment</span>
              <span className="flex-1 h-px bg-border" />
              <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">3</span> Dashboard</span>
            </div>

            {/* Account section */}
            {!user && (
              <Card className="p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-2 mb-1"><User className="w-5 h-5" /><h2 className="font-display font-bold text-2xl">Your account</h2></div>
                <p className="text-sm text-muted-foreground mb-6">We&apos;ll create your account and email you a confirmation.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><Label>Full name</Label><Input required className="h-12 mt-1" value={account.full_name} onChange={e => setAccount({ ...account, full_name: e.target.value })} placeholder="Rahul Sharma" /></div>
                  <div><Label>Email</Label><Input required type="email" className="h-12 mt-1" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} placeholder="you@example.com" /></div>
                  <div><Label>Phone</Label><Input required type="tel" className="h-12 mt-1" value={account.phone} onChange={e => setAccount({ ...account, phone: e.target.value })} placeholder="+91 98xxxx" /></div>
                  <div><Label>Password</Label><Input required type="password" className="h-12 mt-1" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} placeholder="Min. 6 characters" /></div>
                  <div><Label>Confirm password</Label><Input required type="password" className="h-12 mt-1" value={account.confirm} onChange={e => setAccount({ ...account, confirm: e.target.value })} placeholder="Re-type password" /></div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Already have an account? <Link href={`/auth?mode=login&next=/checkout?plan=${plan.id}`} className="underline">Sign in first</Link>
                </p>
              </Card>
            )}

            {/* Kids details */}
            {isKids && (
              <Card className="p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-2 mb-1"><Baby className="w-5 h-5" /><h2 className="font-display font-bold text-2xl">Child profile</h2></div>
                <p className="text-sm text-muted-foreground mb-6">Tell us about the young athlete.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Child&apos;s full name</Label><Input className="h-12 mt-1" value={child.child_name} onChange={e => setChild({ ...child, child_name: e.target.value })} placeholder="Aarav Sharma" /></div>
                  <div><Label>Date of birth</Label><Input type="date" className="h-12 mt-1" value={child.dob} onChange={e => setChild({ ...child, dob: e.target.value })} /></div>
                  <div className="sm:col-span-2">
                    <Label>Gender (optional)</Label>
                    <div className="flex gap-2 mt-2">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button key={g} type="button" onClick={() => setChild({ ...child, gender: g })} className={`px-4 py-2 rounded-lg border text-sm transition ${child.gender === g ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/50'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Sport selection */}
            <Card className="p-6 md:p-8 rounded-2xl">
              <h2 className="font-display font-bold text-2xl mb-1">{isKids ? 'Pick sports' : 'Your access'}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isKids
                  ? 'Up to 2 sports for your kid — you can change these later.'
                  : 'Your Adult Elite membership includes every active sport, no restrictions.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeSports.map(s => {
                  const on = isKids ? selectedSports.includes(s.id) : true;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => isKids && toggleSport(s.id)}
                      className={`p-4 rounded-xl border text-left transition ${on ? 'border-primary bg-secondary' : 'hover:border-primary/50'} ${!isKids ? 'cursor-default' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold">{s.name}</span>
                        {on && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                    </button>
                  );
                })}
              </div>
              {isKids && (
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Selected {selectedSports.length}/2 sports</p>
              )}
            </Card>

            {/* Payment section */}
            <Card className="p-6 md:p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-1"><Lock className="w-5 h-5" /><h2 className="font-display font-bold text-2xl">Payment</h2></div>
              <p className="text-sm text-muted-foreground mb-6">Secure mock checkout — Razorpay integration ready to plug in.</p>
              <div className="space-y-4">
                <div><Label>Cardholder name</Label><Input className="h-12 mt-1" placeholder="Name on card" defaultValue={user?.full_name || account.full_name} /></div>
                <div><Label>Card number</Label><Input className="h-12 mt-1" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Expiry</Label><Input className="h-12 mt-1" placeholder="MM/YY" defaultValue="12/28" /></div>
                  <div><Label>CVV</Label><Input className="h-12 mt-1" placeholder="123" defaultValue="123" /></div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" /> Mock payment for MVP — no real charge will be made.
              </div>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div>
            <Card className="p-6 rounded-2xl lg:sticky lg:top-24">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Order Summary</p>
              <h3 className="font-display font-black text-2xl">{plan.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}</Badge>
                {plan.popular && <Badge className="bg-accent text-black hover:bg-accent">Popular</Badge>}
                {plan.savings && <Badge variant="outline">{plan.savings}</Badge>}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{plan.price.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST (incl.)</span><span>—</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Per month</span><span>₹{perMonth.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-baseline">
                <span className="font-semibold">Total</span>
                <span className="font-display font-black text-3xl">₹{plan.price.toLocaleString('en-IN')}</span>
              </div>

              <Button onClick={pay} disabled={processing} className="w-full mt-6 h-14 bg-accent text-black hover:bg-accent/90 text-base font-semibold">
                {processing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…</>
                ) : (
                  <><CreditCard className="w-5 h-5 mr-2" /> Pay ₹{plan.price.toLocaleString('en-IN')}</>
                )}
              </Button>

              <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-primary mt-0.5" /> {plan.max_sports ? `Up to ${plan.max_sports} sports` : 'All active sports included'}</li>
                <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-primary mt-0.5" /> Unlimited class bookings</li>
                <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-primary mt-0.5" /> One free pause (up to 30 days)</li>
                <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-primary mt-0.5" /> Cancel anytime</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><CheckoutInner /></Suspense>;
}
