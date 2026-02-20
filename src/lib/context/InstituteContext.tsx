'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// Types
export type UserRole = 'owner' | 'admin' | 'teacher';

export interface InstituteWithRole {
  id: string;
  name: string;
  code: string;
  role: UserRole;
}

interface InstituteContextType {
  // Current selected institute and role
  institute: InstituteWithRole | null;
  role: UserRole | null;
  
  // All institutes the user belongs to
  institutes: InstituteWithRole[];
  
  // Loading state
  loading: boolean;
  
  // Switch to a different institute
  switchInstitute: (instituteId: string) => void;
  
  // Refresh institutes list
  refreshInstitutes: () => Promise<void>;
}

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

const STORAGE_KEY = 'goowrite_selected_institute';

export function InstituteProvider({ children }: { children: ReactNode }) {
  const [institutes, setInstitutes] = useState<InstituteWithRole[]>([]);
  const [currentInstituteId, setCurrentInstituteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all institutes the user belongs to
  const fetchInstitutes = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_institute_roles')
      .select(`
        role,
        institutes(id, name, code)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching institutes:', error);
      setLoading(false);
      return;
    }

    const userInstitutes: InstituteWithRole[] = (data || [])
      .filter(item => item.institutes)
      .map(item => ({
        id: (item.institutes as any).id,
        name: (item.institutes as any).name,
        code: (item.institutes as any).code,
        role: item.role as UserRole,
      }));

    setInstitutes(userInstitutes);

    // Restore previously selected institute from localStorage
    const savedId = localStorage.getItem(STORAGE_KEY);
    const validSavedId = userInstitutes.find(i => i.id === savedId)?.id;
    
    // Use saved institute, or first institute, or null
    setCurrentInstituteId(validSavedId || userInstitutes[0]?.id || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  // Switch to a different institute
  const switchInstitute = useCallback((instituteId: string) => {
    const found = institutes.find(i => i.id === instituteId);
    if (found) {
      setCurrentInstituteId(instituteId);
      localStorage.setItem(STORAGE_KEY, instituteId);
    }
  }, [institutes]);

  // Get current institute with role
  const currentInstitute = institutes.find(i => i.id === currentInstituteId) || null;

  const value: InstituteContextType = {
    institute: currentInstitute,
    role: currentInstitute?.role || null,
    institutes,
    loading,
    switchInstitute,
    refreshInstitutes: fetchInstitutes,
  };

  return (
    <InstituteContext.Provider value={value}>
      {children}
    </InstituteContext.Provider>
  );
}

export function useInstitute() {
  const context = useContext(InstituteContext);
  if (context === undefined) {
    throw new Error('useInstitute must be used within an InstituteProvider');
  }
  return context;
}

// Helper hooks
export function useIsOwner() {
  const { role } = useInstitute();
  return role === 'owner';
}

export function useIsAdmin() {
  const { role } = useInstitute();
  return role === 'owner' || role === 'admin';
}

export function useCanAccessFeature(feature: 'fees' | 'admissions' | 'team') {
  const { role } = useInstitute();
  // Teachers cannot access these features
  if (role === 'teacher') return false;
  return true;
}
