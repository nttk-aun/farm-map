'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const items = [
  { href: '/farm-map', label: 'แผนที่' },
  { href: '/farm-map/list', label: 'รายการฟาร์ม' },
  { href: '/farm-map/add', label: 'เพิ่มฟาร์ม' },
  { href: '/farm-map/dashboard', label: 'Dashboard' },
];

export default function FarmNavTabs() {
  try {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'admin';
    const visibleItems = isAdmin ? items : items.filter((item) => item.href !== '/farm-map/add');

    const handleSignOut = async () => {
      try {
        await signOut({ callbackUrl: '/farm-map' });
      } catch (error) {
        console.error('handleSignOut error:', error);
      }
    };

    return (
      <div className="ui-nav-tabs">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/farm-map/list' && pathname?.startsWith('/farm-map/edit'));
          return (
            <Link key={item.href} href={item.href} className={`ui-nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </Link>
          );
        })}
        {isAdmin ? (
          <button type="button" className="ui-btn ui-btn-secondary" onClick={handleSignOut}>
            ออกจากระบบ ({session?.user?.username || 'admin'})
          </button>
        ) : (
          <Link href="/login" className={`ui-nav-link ${pathname === '/login' ? 'active' : ''}`}>
            เข้าสู่ระบบแอดมิน
          </Link>
        )}
      </div>
    );
  } catch (error) {
    console.error('FarmNavTabs error:', error);
    return null;
  }
}
