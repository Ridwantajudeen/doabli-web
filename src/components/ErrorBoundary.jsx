import { Component } from 'react';
import { useTheme } from '../context/ThemeContext';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { theme, Colors } = this.props;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '20px',
            backgroundColor: theme.background,
            color: theme.text,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '8px', color: Colors.error }}> Something went wrong</h2>
          <p style={{ opacity: 0.6, marginBottom: '16px', maxWidth: '400px' }}>
            An unexpected error occurred. Please try refreshing the page or going back.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: theme.uiBackground,
                borderRadius: '8px',
                maxWidth: '500px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <summary style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error details</summary>
              <pre
                style={{
                  overflow: 'auto',
                  fontSize: '12px',
                  opacity: 0.7,
                }}
              >
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.href = '/'}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: Colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }) {
  const { theme, Colors } = useTheme();
  return (
    <ErrorBoundaryInner theme={theme} Colors={Colors}>
      {children}
    </ErrorBoundaryInner>
  );
}

export default ErrorBoundary;
