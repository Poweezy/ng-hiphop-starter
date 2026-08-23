'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BottomNavigation() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', emoji: '🏠', active: pathname === '/' },
    { href: '/library', label: 'Library', active: pathname === '/library' },
    { href: '/#community-quotes', label: 'Community', active: false },
    { href: '/game/best-lyrics', label: 'Competitions', active: pathname?.startsWith('/game/best-lyrics') ?? false },
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
          <span className="bottom-nav-emoji" aria-hidden="true">{item.emoji}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
