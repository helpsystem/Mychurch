import React from 'react';

// 1. دکمه‌های مدرن
export const ModernButton = ({ children, variant = 'primary', size = 'md', ...props }: any) => {
  const baseClasses = "font-semibold rounded-lg transition-all duration-300 transform active:scale-95";
  
  const variants: any = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400",
    ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };
  
  const sizes: any = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 2. کارت مدرن
export const ModernCard = ({ children, hover = true, className = '', ...props }: any) => {
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800
        rounded-2xl
        shadow-lg
        overflow-hidden
        transition-all duration-300
        ${hover ? 'hover:shadow-2xl hover:-translate-y-2' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// 3. Badge
export const Badge = ({ children, color = 'blue', size = 'sm', className = '', ...props }: any) => {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };
  
  const sizes: any = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-1.5 text-base',
  };
  
  return (
    <span 
      className={`
        inline-block
        rounded-full
        font-semibold
        ${colors[color]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// 4. Alert
export const Alert = ({ type = 'info', children, icon }: any) => {
  const types: any = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-700 dark:text-green-300',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-700 dark:text-red-300',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'ℹ'
    },
  };
  
  const config = types[type];
  
  return (
    <div className={`
      flex items-start gap-3
      p-4
      ${config.bg}
      border-l-4 ${config.border}
      rounded-lg
      ${config.text}
    `}>
      <span className="text-xl">{icon || config.icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
};

// 5. Loading Spinner (Cross/Plus)
export const Spinner = ({ size = 'md' }: any) => {
  const sizes: any = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={`relative ${sizes[size]} animate-spin`}>
      {/* Vertical bar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 via-purple-500 to-blue-400 rounded-full" />
      {/* Horizontal bar */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 rounded-full" />
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
    </div>
  );
};

// 6. Skeleton Loading
export const Skeleton = ({ className = '', lines = 1 }: any) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
};

// 7. Modal/Dialog
export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        p-4
        animate-fade-in
      "
      onClick={onClose}
    >
      <div 
        className="
          bg-white dark:bg-gray-800
          rounded-2xl
          shadow-2xl
          max-w-lg w-full
          max-h-[90vh]
          overflow-hidden
          animate-slide-up
        "
        onClick={(e: any) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="
            flex items-center justify-between
            p-6 border-b border-gray-200 dark:border-gray-700
          ">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="
                text-gray-400 hover:text-gray-600
                dark:hover:text-gray-300
                transition-colors
              "
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// 8. Input Field
export const Input = ({ label, error, icon, ...props }: any) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input 
          className={`
            w-full
            px-4 py-3
            ${icon ? 'pl-10' : ''}
            border-2
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            rounded-lg
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            dark:focus:ring-blue-800
            transition-all duration-200
            placeholder:text-gray-400
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

// 9. Progress Bar
export const ProgressBar = ({ value, max = 100, color = 'blue', showPercentage = true }: any) => {
  const percentage = (value / max) * 100;
  
  const colors: any = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
  };
  
  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className={`
            h-full ${colors[color]}
            transition-all duration-500 ease-out
            rounded-full
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-right">
          {percentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
};

// 10. Avatar
export const Avatar = ({ src, alt, size = 'md', online = false }: any) => {
  const sizes: any = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };
  
  return (
    <div className="relative inline-block">
      <img 
        src={src}
        alt={alt}
        className={`
          ${sizes[size]}
          rounded-full
          object-cover
          border-2 border-white dark:border-gray-700
          shadow-md
        `}
      />
      {online && (
        <span className="
          absolute bottom-0 right-0
          w-3 h-3
          bg-green-500
          border-2 border-white dark:border-gray-700
          rounded-full
        " />
      )}
    </div>
  );
};

// 11. Glassmorphism Card
export const GlassCard = ({ children, className = '' }: any) => {
  return (
    <div className={`
      backdrop-blur-lg
      bg-white/30 dark:bg-gray-800/30
      border border-white/20 dark:border-gray-700/20
      rounded-2xl
      shadow-xl
      ${className}
    `}>
      {children}
    </div>
  );
};

// 12. Gradient Text
export const GradientText = ({ children, gradient = 'blue-purple', className = '' }: any) => {
  const gradients: any = {
    'blue-purple': 'from-blue-600 to-purple-600',
    'pink-orange': 'from-pink-600 to-orange-600',
    'green-blue': 'from-green-600 to-blue-600',
    'red-pink': 'from-red-600 to-pink-600',
  };
  
  return (
    <span className={`
      bg-gradient-to-r ${gradients[gradient]}
      bg-clip-text text-transparent
      font-bold
      ${className}
    `}>
      {children}
    </span>
  );
};

export default {
  ModernButton,
  ModernCard,
  Badge,
  Alert,
  Spinner,
  Skeleton,
  Modal,
  Input,
  ProgressBar,
  Avatar,
  GlassCard,
  GradientText,
};
