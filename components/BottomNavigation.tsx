'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function BottomNavigation() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', icon: '/images/logo.png', active: pathname === '/' },
    { href: '/library', label: 'Music', icon: null, active: pathname === '/library', emoji: '🎵' },
    { href: '/#community-quotes', label: 'Community', icon: null, active: false, emoji: '💬' },
    { href: '/game/best-lyrics', label: 'Competitions', icon: null, active: pathname?.startsWith('/game/best-lyrics'), emoji: '🏆' },
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottom-nav-item ${item.active ? 'bottom-nav-item--active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.icon ? (
            <Image src={item.icon} alt="" width={24} height={24} className="bottom-nav-icon" />
          ) : (
            <span className="bottom-nav-emoji" aria-hidden="true">{item.emoji}</span>
          )}
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
