'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DiscIcon, HomeIcon, TrophyIcon, UsersIcon } from './icons';

export default function BottomNavigation() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', Icon: HomeIcon, active: pathname === '/' },
    { href: '/library', label: 'Library', Icon: DiscIcon, active: pathname === '/library' },
    { href: '/#community-quotes', label: 'Community', Icon: UsersIcon, active: false },
    { href: '/game/best-lyrics', label: 'Competitions', Icon: TrophyIcon, active: pathname?.startsWith('/game/best-lyrics') ?? false },
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
          <span className="bottom-nav-icon-wrap" aria-hidden="true">
            <item.Icon size={22} />
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
