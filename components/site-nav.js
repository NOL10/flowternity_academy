'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';
import { Menu, X, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SiteNav({ dark = false }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/memberships', label: 'Memberships' },
    { href: '/classes', label: 'Classes' },
    { href: '/coaches', label: 'Coaches' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const textColor = dark ? 'text-white' : 'text-foreground';
  const border = dark ? 'border-white/10' : 'border-black/10';

  return (
    <header className={`w-full ${dark ? 'bg-transparent' : 'bg-background/80 backdrop-blur-lg'} border-b ${border} sticky top-0 z-40`}>
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className={`flex items-center gap-2 ${textColor}`}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">FLOWTERNITY</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-sm font-medium ${textColor} opacity-80 hover:opacity-100 transition`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar className="w-9 h-9"><AvatarFallback className="bg-accent text-black font-semibold">{user.full_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/classes">Book Class</Link></DropdownMenuItem>
                {user.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin">Admin Panel</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth?mode=login"><Button variant={dark ? 'ghost' : 'ghost'} className={dark ? 'text-white hover:bg-white/10 hover:text-white' : ''}>Sign in</Button></Link>
              <Link href="/auth?mode=register"><Button className="bg-accent text-black hover:bg-accent/90">Join Now</Button></Link>
            </>
          )}
        </div>

        <button className={`md:hidden ${textColor}`} onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden border-t ${border} ${dark ? 'bg-black' : 'bg-background'}`}>
          <div className="container py-4 flex flex-col gap-3">
            {links.map(l => (
              <Link key={l.href} href={l.href} className={`text-sm font-medium ${textColor} py-2`} onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" className={`text-sm font-medium ${textColor} py-2`}>Dashboard</Link>
                {user.role === 'admin' && <Link href="/admin" className={`text-sm font-medium ${textColor} py-2`}>Admin</Link>}
                <button onClick={logout} className="text-sm text-destructive text-left py-2">Sign out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link className="flex-1" href="/auth?mode=login"><Button variant="outline" className="w-full">Sign in</Button></Link>
                <Link className="flex-1" href="/auth?mode=register"><Button className="w-full bg-accent text-black hover:bg-accent/90">Join Now</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
