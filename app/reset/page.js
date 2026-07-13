'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Zap, ArrowRight, CheckCircle } from 'lucide-react';

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords don\'t match');
    if (password.length < 6) return toast.error('Password must be 6+ chars');
    setLoading(true);
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const d = await res.json();
    if (res.ok) { setDone(true); toast.success('Password reset!'); setTimeout(() => router.push('/auth?mode=login'), 1500); }
    else toast.error(d.error || 'Reset failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 rounded-3xl">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
          <span className="font-display font-extrabold text-xl">FLOWTERNITY</span>
        </Link>

        {done ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-accent" />
            <h1 className="font-display font-black text-3xl mt-4">Done!</h1>
            <p className="text-muted-foreground mt-2">Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            <h1 className="font-display font-black text-3xl">Reset password</h1>
            <p className="text-muted-foreground mt-2">Pick a new password for your account.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div><Label>New Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="h-12 mt-1" placeholder="6+ characters" /></div>
              <div><Label>Confirm Password</Label><Input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="h-12 mt-1" /></div>
              <Button disabled={loading || !token} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">{loading ? 'Resetting...' : 'Reset Password'} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              {!token && <p className="text-sm text-destructive text-center">Missing token. Please use the link from Forgot Password page.</p>}
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<div />}><ResetInner /></Suspense>;
}
