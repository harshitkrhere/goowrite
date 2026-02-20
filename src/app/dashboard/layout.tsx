'use client';

import { InstituteProvider } from '@/lib/context/InstituteContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import DashboardWrapper from './DashboardWrapper';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InstituteProvider>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <main className={styles.content}>
            <DashboardWrapper>
              {children}
            </DashboardWrapper>
          </main>
        </div>
      </div>
    </InstituteProvider>
  );
}
