'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { Button, Input, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function SetupUsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      const supabase = createClient();
      
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();
      
      setIsAvailable(!data);
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      // Update existing user's username
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: username.toLowerCase().trim() })
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
          email: user.email,
          username: username.toLowerCase().trim(),
          full_name: user.user_metadata?.full_name || null,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This username is already taken');
        } else {
          setError(insertError.message);
        }
        setIsLoading(false);
        return;
      }
    }

    // Redirect to setup or dashboard
    router.push('/setup');
    router.refresh();
  };

  const handleUsernameChange = (value: string) => {
    // Only allow lowercase letters, numbers, and underscores
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
  };

  return (
    <div className={styles.container}>
      {/* Animated background orbs */}
      <div className={styles.backgroundOrbs}>
        <motion.div 
          className={styles.orb1}
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className={styles.orb2}
          animate={{ 
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={styles.formWrapper}
      >
        <GlassCard variant="elevated" padding="lg" className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <motion.div 
              className={styles.logo}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <User size={32} />
            </motion.div>
            <h1 className={styles.title}>Choose your username</h1>
            <p className={styles.subtitle}>This will be your unique identifier</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.usernameInputWrapper}>
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
                    ? 'This username is available!'
                    : isAvailable === false
                    ? 'This username is taken'
                    : 'Only lowercase letters, numbers, and underscores'
                }
                error={error}
                required
                fullWidth
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!isAvailable || isChecking}
              rightIcon={isLoading ? undefined : <ArrowRight size={18} />}
              fullWidth
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
