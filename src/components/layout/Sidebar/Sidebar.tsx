'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  ClipboardList,
} from 'lucide-react';
import { useInstitute } from '@/lib/context/InstituteContext';
import GooWriteLogo from '@/components/ui/GooWriteLogo';
import styles from './Sidebar.module.css';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: ('owner' | 'admin' | 'teacher')[];
}

const navItems: NavItem[] = [
  { 
    icon: <LayoutDashboard size={20} />, 
    label: 'Dashboard', 
    href: '/dashboard',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <Users size={20} />, 
    label: 'Students', 
    href: '/dashboard/students',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <GraduationCap size={20} />, 
    label: 'Batches', 
    href: '/dashboard/batches',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <BookOpen size={20} />, 
    label: 'Courses', 
    href: '/dashboard/courses',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <ClipboardList size={20} />, 
    label: 'Attendance', 
    href: '/dashboard/attendance',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <GraduationCap size={20} />, 
    label: 'Tests', 
    href: '/dashboard/tests',
    roles: ['owner', 'admin', 'teacher'],
  },
  { 
    icon: <CreditCard size={20} />, 
    label: 'Fees', 
    href: '/dashboard/fees',
    roles: ['owner', 'admin'],
  },
  { 
    icon: <UserPlus size={20} />, 
    label: 'Admissions', 
    href: '/dashboard/admissions',
    roles: ['owner', 'admin'],
  },
  { 
    icon: <UsersRound size={20} />, 
    label: 'Team', 
    href: '/dashboard/team',
    roles: ['owner', 'admin'],
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { role, loading } = useInstitute();

  const visibleNavItems = navItems.filter(item => 
    role ? item.roles.includes(role) : false
  );

  return (
    <aside 
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <GooWriteLogo size={24} />
        </div>
        {!isCollapsed && <span className={styles.logoText}>Goo Write</span>}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {loading ? (
          <div className={styles.skeletonNav}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className={styles.skeletonItem} />
            ))}
          </div>
        ) : (
          <ul className={styles.navList}>
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!isCollapsed && (
                      <span className={styles.navLabel}>{item.label}</span>
                    )}
                    {isActive && <div className={styles.activeIndicator} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Toggle Button */}
      <button
        className={styles.toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
