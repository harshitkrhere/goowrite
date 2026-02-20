'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function SetupInstitutePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [error, setError] = useState('');

  // Check if user needs to set up username first
  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user record exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Create user record first
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });

        if (insertError && insertError.code !== '23505') {
          console.error('Error creating user:', insertError);
        }
      }

      setIsCheckingUser(false);
    }

    checkUser();
  }, [router]);

  // Auto-generate code from name
  const handleNameChange = (value: string) => {
    setName(value);
    const generatedCode = value
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 20);
    setCode(generatedCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Institute name is required');
      setIsLoading(false);
      return;
    }

    if (!code.trim() || code.length < 3) {
      setError('Code must be at least 3 characters');
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

    // Ensure user record exists (double check)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        });

      if (userError && userError.code !== '23505') {
        setError('Failed to create user profile. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Create institute (owner role is auto-assigned by trigger)
    const { error: instituteError } = await supabase
      .from('institutes')
      .insert({
        name: name.trim(),
        code: code.trim(),
        created_by: user.id,
      });

    if (instituteError) {
      if (instituteError.code === '23505') {
        setError('This code is already taken. Please choose a different one.');
      } else {
        setError(instituteError.message);
      }
      setIsLoading(false);
      return;
    }

    // Redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  };

  if (isCheckingUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Setting up your account...</p>
        </div>
      </div>
    );
  }

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
              <Building2 size={32} />
            </motion.div>
            <h1 className={styles.title}>Create your institute</h1>
            <p className={styles.subtitle}>Set up your coaching institute to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="text"
              label="Institute Name"
              placeholder="ABC Coaching Classes"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              leftIcon={<Building2 size={18} />}
              required
              fullWidth
            />

            <Input
              type="text"
              label="Institute Code"
              placeholder="ABC-DELHI"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              hint="Short unique identifier (e.g., ABC-DELHI)"
              error={error}
              required
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={isLoading ? undefined : <ArrowRight size={18} />}
              fullWidth
            >
              {isLoading ? 'Creating...' : 'Create Institute'}
            </Button>
          </form>
        </GlassCard>
      </motion.div>

      {/* Footer */}
      <motion.p 
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        You can invite team members after setup
      </motion.p>
    </div>
  );
}
