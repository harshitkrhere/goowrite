'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { Button, Input, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './UsernameModal.module.css';

interface UsernameModalProps {
  onComplete: () => void;
}

export default function UsernameModal({ onComplete }: UsernameModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Check if user needs to set username
  useEffect(() => {
    async function checkUserProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check if user has username set
      const { data: existingUser } = await supabase
        .from('users')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // User doesn't exist in users table, show modal
        setFullName(user.user_metadata?.full_name || '');
        setIsOpen(true);
      } else if (!existingUser.username) {
        // User exists but no username
        setFullName(existingUser.full_name || '');
        setIsOpen(true);
      } else {
        // Username already set
        onComplete();
      }
    }

    checkUserProfile();
  }, [onComplete]);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if username exists (excluding current user)
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', user?.id || '')
        .maybeSingle();
      
      // If data exists, username is taken
      // If data is null and no error, username is available
      setIsAvailable(data === null && !error);
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    if (!isAvailable) {
      setError('This username is already taken');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    // Check if user record exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          username: username.toLowerCase().trim(),
          full_name: fullName.trim() || undefined,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
    } else {
      // Create new user record
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          username: username.toLowerCase().trim(),
          full_name: fullName.trim() || user.email?.split('@')[0] || 'User',
        });

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }
    }

    setIsOpen(false);
    onComplete();
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={styles.modalWrapper}
        >
          <GlassCard variant="elevated" padding="lg" className={styles.modal}>
            <div className={styles.header}>
              <div className={styles.iconWrapper}>
                <User size={28} />
              </div>
              <h2>Welcome! Set up your profile</h2>
              <p>Choose a unique username for your account</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />

              <Input
                type="text"
                label="Username"
                placeholder="john_doe"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                leftIcon={<User size={18} />}
                rightIcon={
                  isChecking ? (
                    <Loader2 size={18} className={styles.spinnerSmall} />
                  ) : isAvailable === true ? (
                    <Check size={18} className={styles.available} />
                  ) : isAvailable === false ? (
                    <X size={18} className={styles.unavailable} />
                  ) : null
                }
                hint={
                  isAvailable === true
                    ? 'Username available!'
                    : isAvailable === false
                    ? 'Username taken'
                    : 'Only lowercase letters, numbers, and underscores'
                }
                error={error}
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!isAvailable || isChecking}
                rightIcon={isLoading ? undefined : <ArrowRight size={18} />}
                fullWidth
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
