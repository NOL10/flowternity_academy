'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { Zap, ArrowRight } from 'lucide-react';

function AuthInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const initialMode = params.get('mode') === 'login' ? 'login' : 'register';
  const next = params.get('next') || '/dashboard';

  const [tab, setTab] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('adult');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });

  useEffect(() => { setTab(initialMode); }, [initialMode]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = tab === 'login' ? { email: form.email, password: form.password } : { ...form, role };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setLoading(false); return; }
      toast.success(tab === 'login' ? 'Welcome back!' : 'Account created!');
      await refresh();
      router.push(next);
    } catch { toast.error('Network error'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1595795279832-13f0df36fbb9?auto=format&fit=crop&q=80&w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <span className="font-display font-extrabold text-xl">FLOWTERNITY</span>
          </Link>
        </div>
        <div className="relative">
          <h1 className="font-display font-black text-5xl leading-[0.95]">Train.<br />Play.<br /><span className="text-accent">Belong.</span></h1>
          <p className="text-white/60 mt-6 max-w-sm">A single account. Every sport. Every session. Every court.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 border-none shadow-none">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
              <span className="font-display font-extrabold text-xl">FLOWTERNITY</span>
            </Link>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-8">
              <h2 className="font-display font-black text-3xl mb-2">Welcome back.</h2>
              <p className="text-muted-foreground mb-6">Sign in to book your next class.</p>
              <form onSubmit={submit} className="space-y-4">
                <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-12 mt-1" /></div>
                <div><Label>Password</Label><Input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-12 mt-1" /></div>
                <div className="flex justify-end -mt-2"><Link href="/forgot" className="text-sm text-muted-foreground hover:text-foreground">Forgot password?</Link></div>
                <Button disabled={loading} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">{loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-8">
              <h2 className="font-display font-black text-3xl mb-2">Create your account.</h2>
              <p className="text-muted-foreground mb-6">Join Flowternity in under 60 seconds.</p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label className="mb-2 block">I&apos;m signing up as</Label>
                  <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${role === 'adult' ? 'border-primary bg-secondary' : ''}`}>
                      <RadioGroupItem value="adult" />
                      <span className="text-sm font-medium">Adult (18+)</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${role === 'parent' ? 'border-primary bg-secondary' : ''}`}>
                      <RadioGroupItem value="parent" />
                      <span className="text-sm font-medium">Parent (for kid)</span>
                    </label>
                  </RadioGroup>
                </div>
                <div><Label>Full Name</Label><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="h-12 mt-1" /></div>
                <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-12 mt-1" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-12 mt-1" /></div>
                <div><Label>Password</Label><Input type="password" minLength={6} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-12 mt-1" placeholder="6+ characters" /></div>
                <Button disabled={loading} type="submit" className="w-full h-12 bg-accent text-black hover:bg-accent/90">{loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-6">By continuing you agree to our terms & privacy.</p>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<div />}><AuthInner /></Suspense>;
}
