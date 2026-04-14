import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  interactive = false,
}) => {
  return (
    <div
      className={`
        surface-card rounded-2xl p-6
        ${interactive ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-slate-500' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
