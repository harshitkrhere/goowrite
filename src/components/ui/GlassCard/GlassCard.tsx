'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './GlassCard.module.css';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      interactive = false,
      glow = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      interactive ? styles.interactive : '',
      glow ? styles.glow : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          className={classes}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
