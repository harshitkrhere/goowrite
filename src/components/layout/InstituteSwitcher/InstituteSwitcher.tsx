'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInstitute, InstituteWithRole } from '@/lib/context/InstituteContext';
import styles from './InstituteSwitcher.module.css';

export default function InstituteSwitcher() {
  const router = useRouter();
  const { institute, institutes, switchInstitute, loading } = useInstitute();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (inst: InstituteWithRole) => {
    switchInstitute(inst.id);
    setIsOpen(false);
    window.location.reload();
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    router.push('/setup');
  };

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  if (!institute) {
    return (
      <button className={styles.createBtn} onClick={handleCreateNew}>
        <Plus size={16} />
        <span>Create Institute</span>
      </button>
    );
  }

  return (
    <div className={styles.switcher} ref={dropdownRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.instituteIcon}>
          <Building2 size={18} />
        </div>
        <div className={styles.instituteInfo}>
          <span className={styles.instituteName}>{institute.name}</span>
          <span className={styles.instituteRole}>{institute.role}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Your Institutes</span>
          </div>
          
          <ul className={styles.instituteList}>
            {institutes.map((inst) => (
              <li key={inst.id}>
                <button
                  className={`${styles.instituteItem} ${inst.id === institute.id ? styles.active : ''}`}
                  onClick={() => handleSelect(inst)}
                >
                  <div className={styles.itemIcon}>
                    <Building2 size={16} />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{inst.name}</span>
                    <span className={styles.itemRole}>{inst.role}</span>
                  </div>
                  {inst.id === institute.id && <Check size={16} className={styles.checkIcon} />}
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.dropdownFooter}>
            <button className={styles.createNewBtn} onClick={handleCreateNew}>
              <Plus size={16} />
              <span>Create New Institute</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
