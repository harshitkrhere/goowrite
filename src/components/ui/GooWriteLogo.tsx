import React from 'react';

interface GooWriteLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * GooWrite Logo — A geometric "G" lettermark with an integrated pen nib.
 * 
 * Design philosophy: The letter "G" is constructed from clean geometric arcs.
 * The horizontal bar of the G transforms into a pen nib pointing right,
 * symbolizing writing/education. The indigo-to-violet gradient reflects
 * the brand's premium identity.
 * 
 * Inspired by: Stripe, Linear, Notion logo aesthetics.
 */
export default function GooWriteLogo({ size = 24, className, ...props }: GooWriteLogoProps) {
  const id = React.useId();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* 
        Rounded square background — like Slack, Discord, Notion app icons.
        Gives the logo presence and makes it work on any background.
      */}
      <rect 
        x="2" y="2" 
        width="60" height="60" 
        rx="14" 
        fill={`url(#${id}-grad)`}
      />

      {/* 
        The "G" lettermark:
        - A thick arc (270° of a circle) forms the main body of the G
        - The horizontal bar of the G extends into a pointed pen nib
        - Both elements are white on the gradient background
      */}
      
      {/* G arc — open at the right side */}
      <path
        d="M 42 24
           A 13 13 0 1 0 42 34"
        fill="none"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      
      {/* G horizontal bar → pen nib */}
      <path
        d="M 32 34 L 42 34 L 48 29 L 42 34"
        fill="none"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ink dot — small detail that adds polish */}
      <circle cx="49" cy="29" r="2" fill="white" opacity="0.7" />
    </svg>
  );
}
