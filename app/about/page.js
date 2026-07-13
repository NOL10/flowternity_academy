'use client';

import Image from 'next/image';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Users, Target, Zap, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">About</p>
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight leading-[0.95]">
            We built this for<br /><span className="text-muted-foreground">people who move.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
            Flowternity is a multi-sport facility built for athletes who demand excellence. Two international standard basketball courts. Dedicated pickleball, skating, calisthenics and karate spaces. One membership. Zero friction.
          </p>
        </div>
      </section>

      {/* Big image */}
      <section className="relative aspect-[21/9] w-full overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1509027572446-af8401acfdc3?auto=format&fit=crop&q=80&w=2000" alt="Facility" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
      </section>

      {/* Values */}
      <section className="container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl">
          <div>
            <h2 className="font-display font-black text-4xl md:text-5xl">Our mission</h2>
          </div>
          <div className="text-muted-foreground text-lg space-y-4">
            <p>Bring athletes together — to excellence, to passion, to something greater than individual achievement.</p>
            <p>Whether you&apos;re perfecting a jump shot, learning your first ollie, or holding your first handstand, this is where dedication meets opportunity.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {[
            { icon: Trophy, t: 'World-class', d: 'International-standard facilities' },
            { icon: Users, t: 'Community', d: 'Coaches, athletes, champions' },
            { icon: Target, t: 'Focused', d: 'Every session with purpose' },
            { icon: Zap, t: 'Effortless', d: 'Book in 60 seconds' },
          ].map((v, i) => (
            <Card key={i} className="p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center"><v.icon className="w-5 h-5 text-black" /></div>
              <h3 className="font-display font-bold text-xl mt-4">{v.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{v.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <Card className="p-12 md:p-16 bg-primary text-primary-foreground border-0 rounded-3xl">
          <h2 className="font-display font-black text-4xl md:text-5xl leading-[0.95]">Come train with us.</h2>
          <p className="text-white/60 mt-3">Membership starts at ₹2,500/month.</p>
          <div className="flex gap-3 mt-8">
            <Link href="/memberships"><Button className="h-12 bg-accent text-black hover:bg-accent/90">See Plans <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            <Link href="/contact"><Button variant="outline" className="h-12 border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white">Visit Us</Button></Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
