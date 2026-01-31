import { useTheme } from '../context/ThemeContext';

// ThemedView - Container with theme background
export function ThemedView({ children, className = '', style = {}, ...props }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

// ThemedText - Text with theme color
export function ThemedText({ 
  children, 
  title = false, 
  className = '', 
  style = {},
  ...props 
}) {
  const { theme } = useTheme();
  const color = title ? theme.title : theme.text;

  return (
    <span
      style={{
        color,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
}

// ThemedCard - Card with theme styling
export function ThemedCard({ 
  children, 
  className = '', 
  style = {},
  clickable = false,
  onClick,
  ...props 
}) {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.uiBackground,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${theme.uiBackground}`,
        transition: 'all 0.3s ease',
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        ...style,
      }}
      className={`${clickable ? 'hover:shadow-lg' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ThemedTextInput - Input with theme styling
export function ThemedTextInput({
  placeholder,
  value,
  onChange,
  error,
  icon,
  iconOnClick,
  type = 'text',
  className = '',
  style = {},
  ...props
}) {
  const { theme, Colors } = useTheme();

  return (
    <div className="mb-3">
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: theme.uiBackground,
            border: `1px solid ${error ? Colors.warning : theme.uiBackground}`,
            borderRadius: '12px',
            color: theme.text,
            fontSize: '16px',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = Colors.primary;
            e.target.style.boxShadow = `0 0 0 3px ${Colors.primary}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? Colors.warning : theme.uiBackground;
            e.target.style.boxShadow = 'none';
          }}
          className={className}
          {...props}
        />
        {icon && (
          <button
            type="button"
            onClick={iconOnClick}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
            }}
          >
            {icon}
          </button>
        )}
      </div>
      {error && (
        <p
          style={{
            color: Colors.warning,
            fontSize: '13px',
            marginTop: '6px',
            marginBottom: '0',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ThemedLoader - Loading indicator
export function ThemedLoader() {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.background,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${theme.uiBackground}`,
          borderTop: `4px solid ${theme.title}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}