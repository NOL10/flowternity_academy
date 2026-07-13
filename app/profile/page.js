'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { SPORTS } from '@/lib/flowternity/config';
import { Camera, Save, User as UserIcon, Baby, Trophy, Shield, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ full_name: '', phone: '', address: '', emergency_contact: '', photo_url: '' });

  const load = async () => {
    const res = await fetch('/api/profile/full', { credentials: 'include' });
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setForm({
        full_name: d.user.full_name || '', phone: d.user.phone || '',
        address: d.user.address || '', emergency_contact: d.user.emergency_contact || '',
        photo_url: d.user.photo_url || ''
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/auth?mode=login&next=/profile');
    if (user) load();
  }, [user, loading, router]);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    if (res.ok) { toast.success('Profile saved'); refresh(); load(); }
    else toast.error('Failed to save');
    setSaving(false);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be < 3MB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ photo_url: dataUrl }) });
      if (res.ok) { toast.success('Photo updated'); setForm(f => ({ ...f, photo_url: dataUrl })); refresh(); }
      else toast.error('Upload failed');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (loading || !data) return <div className="min-h-screen bg-background"><SiteNav /><div className="container py-20"><div className="animate-pulse space-y-3"><div className="h-8 w-1/3 bg-secondary rounded" /><div className="h-32 bg-secondary rounded-2xl" /></div></div></div>;

  const isParent = user.role === 'parent';
  const kids = data.children || [];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container py-10 md:py-14 max-w-5xl">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Profile</p>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">Your account</h1>

        {/* Header card */}
        <Card className="p-6 md:p-8 rounded-3xl mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-background shadow">
                {form.photo_url ? <AvatarImage src={form.photo_url} /> : null}
                <AvatarFallback className="bg-accent text-black font-black text-2xl">{user.full_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadPhoto} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl md:text-3xl">{user.full_name}</h2>
                <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                {user.role === 'admin' && <Badge className="bg-accent text-black hover:bg-accent">Admin</Badge>}
              </div>
              <p className="text-muted-foreground mt-1">{user.email} · {user.phone || 'No phone'}</p>
              <p className="text-sm text-muted-foreground mt-1">Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Left: form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <UserIcon className="w-5 h-5" />
                <h3 className="font-display font-bold text-xl">{isParent ? 'Parent details' : 'Personal details'}</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input className="h-11 mt-1" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input className="h-11 mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Email (read-only)</Label><Input className="h-11 mt-1" value={user.email} readOnly disabled /></div>
                {isParent ? (
                  <div className="sm:col-span-2">
                    <Label>Home Address</Label>
                    <Textarea className="mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Where do we send updates?" />
                  </div>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <Label>Address</Label>
                      <Textarea className="mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Emergency Contact</Label>
                      <Input className="h-11 mt-1" value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Name • Phone • Relation" />
                    </div>
                  </>
                )}
              </div>
              <Button onClick={save} disabled={saving} className="mt-6 h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save changes'}</Button>
            </Card>

            {/* Kids block for parents */}
            {isParent && (
              <Card className="p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Baby className="w-5 h-5" />
                  <h3 className="font-display font-bold text-xl">Kids on your account</h3>
                </div>
                {kids.length === 0 ? (
                  <div className="p-6 rounded-xl border-dashed border text-center text-muted-foreground">
                    No child profiles yet. Purchase a Kids Elite membership to add one.
                    <Link href="/memberships?category=kids"><Button className="mt-3 h-10 bg-primary text-primary-foreground hover:bg-primary/90">Get Kids Membership</Button></Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {kids.map(kid => (
                      <div key={kid.id} className="p-4 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-black">{kid.child_name[0]?.toUpperCase()}</div>
                          <div>
                            <div className="font-semibold">{kid.child_name}</div>
                            <div className="text-xs text-muted-foreground">DOB {new Date(kid.dob).toLocaleDateString('en-IN')} · {kid.gender || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(kid.selected_sports || []).map(sid => {
                            const s = SPORTS.find(x => x.id === sid);
                            return <Badge key={sid} variant="secondary">{s?.name || sid}</Badge>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right: membership + payments summary */}
          <div className="space-y-6">
            <Card className="p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3"><Trophy className="w-4 h-4" /><h3 className="font-display font-bold">Memberships</h3></div>
              {data.memberships?.length ? (
                <div className="space-y-2">
                  {data.memberships.slice(0, 3).map(m => (
                    <div key={m.id} className="p-3 rounded-lg bg-secondary">
                      <div className="flex justify-between">
                        <span className="font-semibold text-sm">{m.membership_snapshot?.name} {m.membership_snapshot?.duration_months}M</span>
                        <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className={m.status === 'active' ? 'bg-accent text-black hover:bg-accent' : ''}>{m.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Expires {new Date(m.expiry_date).toLocaleDateString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No memberships yet.</p>}
            </Card>

            <Card className="p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4" /><h3 className="font-display font-bold">Security</h3></div>
              <Link href="/forgot"><Button variant="outline" className="w-full h-10">Change password</Button></Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
