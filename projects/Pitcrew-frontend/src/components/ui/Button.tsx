import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#22C55E] hover:bg-[#16A34A] text-white',
  secondary: 'bg-[#111827] border border-[#1F2937] hover:border-slate-500 text-slate-100',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={`
        ${variantStyles[variant]} ${sizeStyles[size]}
        rounded-xl font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '⏳ Loading...' : children}
    </button>
  )
}
