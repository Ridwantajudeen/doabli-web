import { Colors } from '../constants/colors';

export default function Card({ 
  children, 
  isDark = true, 
  clickable = false,
  onClick,
  className = '',
  ...props 
}) {
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.uiBackground,
        border: `1px solid ${colors.uiBackground}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      className={`
        ${clickable ? 'hover:shadow-lg hover:scale-105' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
