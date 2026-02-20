'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import GooWriteLogo from '@/components/ui/GooWriteLogo';
import { Button, Input, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user is authenticated (they should be after clicking the email link)
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session means the user navigated here directly without the reset link
        router.push('/forgot-password');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className={styles.container}>
      {/* Background orbs */}
      <div className={styles.backgroundOrbs}>
        <motion.div 
          className={styles.orb1}
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className={styles.orb2}
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={styles.formWrapper}
      >
        <GlassCard variant="elevated" padding="lg" className={styles.card}>
          {success ? (
            <div className={styles.successState}>
              <motion.div 
                className={styles.successIcon}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle size={40} />
              </motion.div>
              <h1 className={styles.title}>Password updated!</h1>
              <p className={styles.subtitle}>
                Your password has been successfully changed. Redirecting you to the dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className={styles.header}>
                <motion.div 
                  className={styles.logo}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <GooWriteLogo size={32} />
                </motion.div>
                <h1 className={styles.title}>Set new password</h1>
                <p className={styles.subtitle}>
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  type="password"
                  label="New password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  required
                  fullWidth
                />

                <Input
                  type="password"
                  label="Confirm new password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  error={error}
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight size={18} />}
                  fullWidth
                >
                  Update password
                </Button>
              </form>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
