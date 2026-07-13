'use client';

import Link from 'next/link';
import Image from 'next/image';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Zap, Users, Calendar, Trophy } from 'lucide-react';
import { SPORTS, MEMBERSHIPS } from '@/lib/flowternity/config';

const HERO_IMG = 'https://images.stockcake.com/public/1/b/f/1bfadcea-7ec1-49e5-94d3-ad24ada973ff_large/basketball-court-drama-stockcake.jpg';

function App() {
  const kidsPlans = MEMBERSHIPS.filter(m => m.category === 'kids');
  const adultPlans = MEMBERSHIPS.filter(m => m.category === 'adult');

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <div className="relative min-h-screen bg-black overflow-hidden">
        <div className="absolute inset-0">
          <Image src={HERO_IMG} alt="Flowternity" fill priority className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>

        <div className="relative z-10">
          <SiteNav dark />
          <div className="container pt-20 md:pt-28 pb-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="bg-accent text-black hover:bg-accent mb-6 font-medium">
                <Zap className="w-3 h-3 mr-1" /> Multi-Sport Facility · Now Booking
              </Badge>
              <h1 className="font-display font-black text-white text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight text-balance">
                TRAIN WITH<br />
                <span className="text-accent">PURPOSE.</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl mt-8 max-w-xl">
                Two international basketball courts. Futsal, pickleball, and more. One membership. Book your first class in under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Link href="/memberships">
                  <Button size="lg" className="bg-accent text-black hover:bg-accent/90 h-14 px-8 text-base font-semibold">
                    Get Membership <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/classes">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
                    View Classes
                  </Button>
                </Link>
              </div>

              <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl border-t border-white/10 pt-10">
                {[
                  { n: '7+', l: 'Sports' },
                  { n: '2', l: 'Intl. Courts' },
                  { n: '60s', l: 'To Book' },
                  { n: '24/7', l: 'App Access' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="font-display font-black text-white text-4xl md:text-5xl">{s.n}</div>
                    <div className="text-white/50 text-sm mt-1 uppercase tracking-wider">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* SPORTS GRID */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Our Programs</p>
              <h2 className="font-display font-black text-5xl md:text-7xl tracking-tight">Pick your sport.</h2>
            </div>
            <p className="text-muted-foreground max-w-md text-lg">World-class facilities across every sport we offer. All included in a single membership.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTS.map((sport, i) => (
              <motion.div key={sport.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary cursor-pointer">
                  <Image src={sport.image} alt={sport.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="400px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  {sport.status === 'coming_soon' && (
                    <Badge className="absolute top-4 right-4 bg-white/20 text-white backdrop-blur-md border-white/20">Coming Soon</Badge>
                  )}
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="font-display font-black text-3xl mb-1">{sport.name}</h3>
                    <p className="text-sm text-white/70 mb-3">{sport.tagline}</p>
                    <p className="text-sm text-white/60 line-clamp-2">{sport.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section id="memberships" className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-white/50 mb-3">Membership</p>
            <h2 className="font-display font-black text-5xl md:text-7xl tracking-tight">One card. All sports.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              { title: 'Kids Elite', sub: 'Age 5–17', plans: kidsPlans, sports: 'Choose up to 2 sports', icon: Users },
              { title: 'Adult Elite', sub: 'Age 18+', plans: adultPlans, sports: 'Access to all sports', icon: Trophy },
            ].map(cat => (
              <div key={cat.title} className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-display font-black text-3xl">{cat.title}</h3>
                    <p className="text-white/60 text-sm mt-1">{cat.sub} · {cat.sports}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <cat.icon className="w-6 h-6 text-black" />
                  </div>
                </div>
                <div className="space-y-3">
                  {cat.plans.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                      <div>
                        <div className="font-semibold">{p.duration_months} {p.duration_months === 1 ? 'Month' : 'Months'}</div>
                        {p.popular && <Badge className="mt-1 bg-accent text-black hover:bg-accent text-xs">Popular</Badge>}
                        {p.savings && !p.popular && <Badge className="mt-1 bg-white/10 text-white text-xs">{p.savings}</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-2xl">₹{p.price.toLocaleString('en-IN')}</div>
                        <div className="text-white/40 text-xs">₹{Math.round(p.price / p.duration_months).toLocaleString('en-IN')}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/memberships?category=${cat.title.toLowerCase().split(' ')[0]}`}>
                  <Button className="w-full mt-6 bg-accent text-black hover:bg-accent/90 h-12">Choose {cat.title} <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Calendar, t: 'Book instantly', d: 'See availability, pick a slot, done.' },
              { icon: Zap, t: 'Pause anytime', d: 'Life happens. Pause your membership when you need.' },
              { icon: Check, t: 'No hidden fees', d: 'One transparent price. All facilities.' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold">{f.t}</h4>
                  <p className="text-white/60 text-sm mt-1">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="container">
          <Card className="p-12 md:p-20 bg-accent border-0 rounded-3xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-display font-black text-5xl md:text-7xl leading-[0.95] text-black">Ready to move?</h2>
              <p className="text-black/70 text-lg mt-4">Join Flowternity today. Your first class is 60 seconds away.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/auth?mode=register"><Button size="lg" className="bg-black text-white hover:bg-black/90 h-14 px-8">Create Account <ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
                <Link href="/memberships"><Button size="lg" variant="outline" className="h-14 px-8 border-black/20 bg-transparent text-black hover:bg-black/10">View Plans</Button></Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <span className="font-display font-extrabold text-xl">FLOWTERNITY</span>
          </div>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Flowternity. Train with purpose.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
