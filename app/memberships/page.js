'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/app/providers';
import { MEMBERSHIPS, SPORTS } from '@/lib/flowternity/config';
import { Check, ArrowRight, Users, Trophy } from 'lucide-react';

function MembershipsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const initialCat = params.get('category') === 'kids' ? 'kids' : 'adult';
  const [category, setCategory] = useState(initialCat);

  const plans = MEMBERSHIPS.filter(m => m.category === category);
  const activeSports = SPORTS.filter(s => s.status === 'active');

  const choose = (plan) => {
    if (!user) { router.push(`/auth?mode=register&next=/checkout?plan=${plan.id}`); return; }
    router.push(`/checkout?plan=${plan.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Memberships</p>
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight">Pick your plan.</h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-xl">One card. All facilities. Pause anytime. No hidden fees.</p>
        </div>

        <Tabs value={category} onValueChange={setCategory} className="mt-10">
          <TabsList className="h-12 p-1">
            <TabsTrigger value="adult" className="h-10 px-6"><Trophy className="w-4 h-4 mr-2" /> Adult Elite</TabsTrigger>
            <TabsTrigger value="kids" className="h-10 px-6"><Users className="w-4 h-4 mr-2" /> Kids Elite</TabsTrigger>
          </TabsList>

          <TabsContent value={category} className="mt-8">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <Card key={plan.id} className={`p-8 rounded-3xl relative ${plan.popular ? 'border-2 border-primary shadow-xl' : ''}`}>
                  {plan.popular && <Badge className="absolute -top-3 left-8 bg-accent text-black hover:bg-accent">Most Popular</Badge>}
                  <div className="flex items-baseline gap-2">
                    <div className="font-display font-black text-5xl">{plan.duration_months}</div>
                    <div className="text-muted-foreground">{plan.duration_months === 1 ? 'Month' : 'Months'}</div>
                  </div>
                  <div className="mt-2"><span className="font-display font-black text-3xl">₹{plan.price.toLocaleString('en-IN')}</span></div>
                  <div className="text-sm text-muted-foreground">₹{Math.round(plan.price / plan.duration_months).toLocaleString('en-IN')}/month</div>

                  {plan.savings && <Badge variant="secondary" className="mt-3">{plan.savings}</Badge>}

                  <ul className="mt-6 space-y-3 text-sm">
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {plan.max_sports ? `Up to ${plan.max_sports} sports` : 'All active sports'}</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> Unlimited class bookings</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> One free pause (up to 30 days)</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> Access to all coaches</li>
                  </ul>

                  <Button onClick={() => choose(plan)} className={`w-full mt-8 h-12 ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-accent text-black hover:bg-accent/90'}`}>
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>

            <div className="mt-16">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">{category === 'kids' ? 'Kids can pick from' : 'Adults get access to'}</p>
              <div className="flex flex-wrap gap-2">
                {activeSports.map(s => (
                  <Badge key={s.id} variant="secondary" className="px-4 py-2 text-sm rounded-full">{s.name}</Badge>
                ))}
                {SPORTS.filter(s => s.status === 'coming_soon').map(s => (
                  <Badge key={s.id} variant="outline" className="px-4 py-2 text-sm rounded-full text-muted-foreground">{s.name} · Coming Soon</Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 border-t pt-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 justify-between">
          <p>Questions? <Link href="/" className="underline">Contact us</Link></p>
          <p>All prices in INR. GST included.</p>
        </div>
      </div>
    </div>
  );
}

export default function MembershipsPage() {
  return <Suspense fallback={<div />}><MembershipsInner /></Suspense>;
}
