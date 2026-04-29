'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/farm-map', label: 'แผนที่' },
  { href: '/farm-map/list', label: 'รายการฟาร์ม' },
  { href: '/farm-map/add', label: 'เพิ่มฟาร์ม' },
  { href: '/farm-map/dashboard', label: 'Dashboard' },
];

export default function FarmNavTabs() {
  try {
    const pathname = usePathname();
    return (
      <div className="ui-nav-tabs">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/farm-map/list' && pathname?.startsWith('/farm-map/edit'));
          return (
            <Link key={item.href} href={item.href} className={`ui-nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error('FarmNavTabs error:', error);
    return null;
  }
}
