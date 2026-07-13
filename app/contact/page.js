'use client';

import { useState } from 'react';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (e) => { e.preventDefault(); toast.success('Message sent! We\'ll reply within 24 hours.'); setForm({ name: '', email: '', message: '' }); };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 max-w-6xl">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
            <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight leading-[0.95]">Say hi.</h1>
            <p className="text-lg text-muted-foreground mt-4">We&apos;d love to hear from you. Drop us a note or visit the facility.</p>

            <div className="mt-10 space-y-5">
              {[
                { icon: MapPin, t: 'Visit', d: 'Flowternity Sports Facility · Bengaluru, India' },
                { icon: Phone, t: 'Call', d: '+91 98765 43210' },
                { icon: Mail, t: 'Email', d: 'hello@flowternity.com' },
                { icon: Clock, t: 'Hours', d: 'Mon–Sun · 6:00 AM – 10:00 PM' },
              ].map((c, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"><c.icon className="w-5 h-5 text-black" /></div>
                  <div><h4 className="font-semibold">{c.t}</h4><p className="text-muted-foreground text-sm">{c.d}</p></div>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-8 rounded-3xl h-fit">
            <h2 className="font-display font-bold text-2xl mb-2">Send us a message</h2>
            <p className="text-sm text-muted-foreground mb-6">We reply within 24 hours.</p>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Name</Label><Input required className="h-12 mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" required className="h-12 mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea required rows={5} className="mt-1" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
              <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">Send Message</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
