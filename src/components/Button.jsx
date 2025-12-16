import { useTheme } from '../context/ThemeContext';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  onClick,
  disabled = false,
  loading = false,
  ...props 
}) {
  const { Colors } = useTheme();

  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: {
      backgroundColor: Colors.primary,
      color: 'white',
      hover: Colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      border: `2px solid ${Colors.primary}`,
      color: Colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: Colors.primary,
    },
    warning: {
      backgroundColor: Colors.warning,
      color: 'white',
      hover: Colors.warning,
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '10px 20px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' },
  };

  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...sizeConfig,
        backgroundColor: variantConfig.backgroundColor,
        color: variantConfig.color,
        border: variantConfig.border || 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variantConfig.hover) {
          e.target.style.opacity = '0.9';
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      }}
      className={className}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
}