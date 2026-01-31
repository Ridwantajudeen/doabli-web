import { Colors } from '../constants/colors';

export default function TextInput({
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  icon,
  iconOnClick,
  className = '',
  isDark = true,
  ...props
}) {
  const colors = isDark ? Colors.dark : Colors.light;

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
            backgroundColor: colors.uiBackground,
            border: `1px solid ${error ? Colors.warning : colors.uiBackground}`,
            borderRadius: '12px',
            color: colors.text,
            fontSize: '16px',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = Colors.primary;
            e.target.style.boxShadow = `0 0 0 3px ${Colors.primary}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? Colors.warning : colors.uiBackground;
            e.target.style.boxShadow = 'none';
          }}
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