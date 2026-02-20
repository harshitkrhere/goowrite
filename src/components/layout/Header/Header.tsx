'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { InstituteSwitcher } from '@/components/layout/InstituteSwitcher';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      {/* Institute Switcher */}
      <InstituteSwitcher />

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Search */}
      <button className={styles.iconBtn} aria-label="Search">
        <Search size={20} />
      </button>

      {/* Notifications */}
      <button className={styles.iconBtn} aria-label="Notifications">
        <Bell size={20} />
        <span className={styles.notificationBadge}>3</span>
      </button>

      {/* User Menu */}
      <div className={styles.userMenuWrapper} ref={userMenuRef}>
        <button 
          className={styles.userBtn}
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-expanded={showUserMenu}
        >
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {showUserMenu && (
          <div className={styles.dropdown}>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setShowUserMenu(false);
                router.push('/dashboard/settings');
              }}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setShowUserMenu(false);
                router.push('/dashboard/settings');
              }}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <div className={styles.dropdownDivider} />
            <button className={styles.dropdownItem} onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
