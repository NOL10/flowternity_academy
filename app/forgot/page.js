'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Zap, ArrowRight, Copy, Check } from 'lucide-react';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const d = await res.json();
    setResult(d);
    setLoading(false);
  };

  const copy = () => {
    if (result?.reset_link) { navigator.clipboard.writeText(result.reset_link); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 rounded-3xl">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
          <span className="font-display font-extrabold text-xl">FLOWTERNITY</span>
        </Link>

        <h1 className="font-display font-black text-3xl">Forgot password?</h1>
        <p className="text-muted-foreground mt-2">Enter your email and we&apos;ll generate a reset link.</p>

        {!result ? (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-12 mt-1" /></div>
            <Button disabled={loading} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">{loading ? 'Generating...' : 'Get Reset Link'} <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-lg bg-secondary">
              <p className="text-sm font-medium">{result.message}</p>
              {result.reset_link && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">Your reset link:</p>
                  <div className="mt-2 flex gap-2 items-center bg-background p-2 rounded border text-xs break-all">
                    <code className="flex-1">{result.reset_link}</code>
                    <Button size="icon" variant="ghost" onClick={copy}>{copied ? <Check className="w-4 h-4 text-accent-foreground" /> : <Copy className="w-4 h-4" />}</Button>
                  </div>
                  <Link href={result.reset_link.replace(/^https?:\/\/[^/]+/, '')}>
                    <Button className="w-full mt-3 bg-accent text-black hover:bg-accent/90">Open Reset Page <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </Link>
                </>
              )}
            </div>
            <button onClick={() => { setResult(null); setEmail(''); }} className="text-sm underline text-muted-foreground">Try another email</button>
          </div>
        )}

        <p className="text-center mt-6 text-sm text-muted-foreground"><Link href="/auth?mode=login" className="underline">Back to sign in</Link></p>
      </Card>
    </div>
  );
}
