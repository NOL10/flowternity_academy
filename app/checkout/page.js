'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/app/providers';
import { MEMBERSHIPS, SPORTS } from '@/lib/flowternity/config';
import { toast } from 'sonner';
import { Check, CreditCard, Loader2, Lock } from 'lucide-react';

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const planId = params.get('plan');
  const plan = MEMBERSHIPS.find(m => m.id === planId);

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('details'); // details | pay
  const [child, setChild] = useState({ child_name: '', dob: '', gender: '' });
  const [selectedSports, setSelectedSports] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push(`/auth?mode=register&next=/checkout?plan=${planId}`);
  }, [loading, user, router, planId]);

  if (!plan) return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-20 text-center">
        <h1 className="font-display font-black text-3xl">Plan not found</h1>
      </div>
    </div>
  );

  const isKids = plan.category === 'kids';
  const activeSports = SPORTS.filter(s => s.status === 'active');

  const toggleSport = (id) => {
    setSelectedSports(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (isKids && prev.length >= 2) { toast.error('Max 2 sports for kids'); return prev; }
      return [...prev, id];
    });
  };

  const proceed = async () => {
    if (isKids) {
      if (!child.child_name || !child.dob) return toast.error('Child name & DOB required');
      if (selectedSports.length === 0) return toast.error('Pick at least 1 sport');
    }
    setStep('pay');
  };

  const pay = async () => {
    setProcessing(true);
    try {
      let child_profile_id = null;
      if (isKids) {
        const cres = await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...child, selected_sports: selectedSports }) });
        const cdata = await cres.json();
        if (!cres.ok) throw new Error(cdata.error);
        child_profile_id = cdata.child.id;
      }
      await new Promise(r => setTimeout(r, 1200)); // simulate payment
      const res = await fetch('/api/checkout/mock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ membership_id: plan.id, child_profile_id, selected_sports: isKids ? selectedSports : [] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Payment successful! Welcome to Flowternity.');
      await refresh();
      router.push('/dashboard?welcome=1');
    } catch (e) {
      toast.error(e.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-12 md:py-16 max-w-5xl">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Checkout</p>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-8">Complete your purchase</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {step === 'details' && (
              <Card className="p-8 rounded-2xl">
                {isKids ? (
                  <>
                    <h2 className="font-display font-bold text-2xl mb-1">Child profile</h2>
                    <p className="text-muted-foreground text-sm mb-6">Tell us about the young athlete.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label>Child&apos;s Full Name</Label><Input className="h-12 mt-1" value={child.child_name} onChange={e => setChild({ ...child, child_name: e.target.value })} /></div>
                      <div><Label>Date of Birth</Label><Input type="date" className="h-12 mt-1" value={child.dob} onChange={e => setChild({ ...child, dob: e.target.value })} /></div>
                      <div className="sm:col-span-2">
                        <Label>Gender (optional)</Label>
                        <div className="flex gap-2 mt-2">
                          {['Male', 'Female', 'Other'].map(g => (
                            <button key={g} type="button" onClick={() => setChild({ ...child, gender: g })} className={`px-4 py-2 rounded-lg border text-sm ${child.gender === g ? 'bg-primary text-primary-foreground border-primary' : ''}`}>{g}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold">Pick sports <span className="text-muted-foreground text-sm font-normal">(up to 2)</span></h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        {activeSports.map(s => (
                          <button key={s.id} onClick={() => toggleSport(s.id)} className={`p-4 rounded-xl border text-left transition ${selectedSports.includes(s.id) ? 'border-primary bg-secondary' : 'hover:border-primary/50'}`}>
                            <div className="flex justify-between items-start">
                              <span className="font-semibold">{s.name}</span>
                              {selectedSports.includes(s.id) && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="font-display font-bold text-2xl mb-1">Confirm details</h2>
                    <p className="text-muted-foreground text-sm mb-6">Your Adult Elite membership grants access to all active sports.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeSports.map(s => (
                        <div key={s.id} className="p-4 rounded-xl border bg-secondary/50">
                          <div className="font-semibold">{s.name}</div>
                          <p className="text-xs text-muted-foreground mt-1">Included</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <Button onClick={proceed} className="w-full mt-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90">Continue to Payment</Button>
              </Card>
            )}

            {step === 'pay' && (
              <Card className="p-8 rounded-2xl">
                <div className="flex items-center gap-2 mb-1"><Lock className="w-4 h-4" /><h2 className="font-display font-bold text-2xl">Payment</h2></div>
                <p className="text-muted-foreground text-sm mb-6">Secure mock checkout (Razorpay integration ready for later).</p>

                <div className="space-y-4">
                  <div><Label>Cardholder Name</Label><Input className="h-12 mt-1" placeholder="As on card" defaultValue={user?.full_name || ''} /></div>
                  <div><Label>Card Number</Label><Input className="h-12 mt-1" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Expiry</Label><Input className="h-12 mt-1" placeholder="MM/YY" defaultValue="12/28" /></div>
                    <div><Label>CVV</Label><Input className="h-12 mt-1" placeholder="123" defaultValue="123" /></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button variant="outline" className="h-12" onClick={() => setStep('details')} disabled={processing}>Back</Button>
                  <Button onClick={pay} disabled={processing} className="flex-1 h-12 bg-accent text-black hover:bg-accent/90 text-base">
                    {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4 mr-2" /> Pay ₹{plan.price.toLocaleString('en-IN')}</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1"><Lock className="w-3 h-3" /> This is a mock payment for MVP. No real charge.</p>
              </Card>
            )}
          </div>

          <div>
            <Card className="p-6 rounded-2xl sticky top-24">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Order Summary</p>
              <h3 className="font-display font-black text-2xl">{plan.name}</h3>
              <Badge variant="secondary" className="mt-2">{plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}</Badge>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{plan.price.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST (incl.)</span><span>—</span></div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display font-black text-2xl">₹{plan.price.toLocaleString('en-IN')}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div />}><CheckoutInner /></Suspense>;
}
