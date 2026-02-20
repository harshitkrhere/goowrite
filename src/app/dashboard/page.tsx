'use client';

import { useRouter } from 'next/navigation';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  UserPlus,
  Loader2,
  Building2,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useDashboardStats } from '@/lib/hooks';
import { useInstitute, useIsAdmin } from '@/lib/context/InstituteContext';
import styles from './page.module.css';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'purple';
}

function StatCard({ title, value, icon, variant = 'blue' }: StatCardProps) {
  return (
    <Card className={styles.statCard} padding="md">
      <div className={`${styles.statIcon} ${styles[variant]}`}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statTitle}>{title}</span>
      </div>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const router = useRouter();
  const { institute, role, loading: instituteLoading } = useInstitute();
  const isAdmin = useIsAdmin();
  const { stats, loading: statsLoading } = useDashboardStats(institute?.id);

  const isLoading = instituteLoading || statsLoading;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!institute) {
    return (
      <div className={styles.emptyState}>
        <Card variant="elevated" padding="lg">
          <Building2 size={48} className={styles.emptyIcon} />
          <h2>Welcome to Goo Write</h2>
          <p>You&apos;re not part of any institute yet. Create one or ask an admin to invite you.</p>
          <Button 
            variant="primary" 
            leftIcon={<Building2 size={18} />}
            onClick={() => router.push('/setup')}
          >
            Create Institute
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back! Here&apos;s what&apos;s happening at <strong>{institute.name}</strong>
          </p>
        </div>
        <div className={styles.roleBadge}>
          {role}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={<Users size={22} />}
          variant="blue"
        />
        <StatCard
          title="Active Batches"
          value={stats.activeBatches.toString()}
          icon={<GraduationCap size={22} />}
          variant="purple"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Fees Collected"
              value={formatCurrency(stats.totalCollected)}
              icon={<CreditCard size={22} />}
              variant="green"
            />
            <StatCard
              title="Fees Due"
              value={formatCurrency(stats.totalDue)}
              icon={<TrendingUp size={22} />}
              variant="orange"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Button 
            variant="secondary" 
            leftIcon={<UserPlus size={18} />}
            onClick={() => router.push('/dashboard/students')}
          >
            Add Student
          </Button>
          <Button 
            variant="secondary" 
            leftIcon={<GraduationCap size={18} />}
            onClick={() => router.push('/dashboard/batches')}
          >
            Create Batch
          </Button>
          <Button 
            variant="secondary" 
            leftIcon={<ClipboardCheck size={18} />}
            onClick={() => router.push('/dashboard/attendance')}
          >
            Mark Attendance
          </Button>
          {isAdmin && (
            <Button 
              variant="secondary" 
              leftIcon={<CreditCard size={18} />}
              onClick={() => router.push('/dashboard/fees')}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
