'use client';

import { useState } from 'react';
import { UsernameModal } from '@/components/modals';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const [profileComplete, setProfileComplete] = useState(false);

  return (
    <>
      {children}
      {!profileComplete && (
        <UsernameModal onComplete={() => setProfileComplete(true)} />
      )}
    </>
  );
}
