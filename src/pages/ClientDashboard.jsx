import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedComponents';
import ClientHome from './client/ClientHome';
import ClientMyErrands from './client/ClientMyErrands';
import ClientMessages from './client/ClientMessages';
import ClientNotifications from './client/ClientNotifications';
import ClientProfile from './client/ClientProfile';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { theme, Colors } = useTheme();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'errands', label: 'My Errands' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <ClientHome />;
      case 'errands': return <ClientMyErrands />;
      case 'messages': return <ClientMessages />;
      case 'notifications': return <ClientNotifications />;
      case 'profile': return <ClientProfile />;
      default: return <ClientHome />;
    }
  };

  return (
    <ThemedView
      style={{
        backgroundColor: theme.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >

      {/* NAVBAR */}
      <nav
        style={{
          width: '100%',
          backgroundColor: theme.navBackground,
          borderBottom: `1px solid ${theme.uiBackground}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        {/* Logo */}
        <h2 style={{ color: Colors.primary, fontSize: '20px', fontWeight: '700' }}>
          Errandly
        </h2>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? Colors.primary : theme.text,
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: '0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={logout}
            style={{
              marginLeft: '12px',
              padding: '8px 14px',
              backgroundColor: Colors.warning,
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
          <Link to="/admin">Admin</Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.text,
            fontSize: '24px',
            display: 'none'
          }}
        >
          ☰
        </button>
      </nav>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav"
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.navBackground,
            padding: '16px',
            borderBottom: `1px solid ${theme.uiBackground}`
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              style={{
                padding: '12px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: '16px',
                color: activeTab === tab.id ? Colors.primary : theme.text,
                borderBottom: `1px solid ${theme.uiBackground}`
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={logout}
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: Colors.warning,
              border: 'none',
              color: '#fff',
              borderRadius: '6px'
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '20px' }}>
        {renderContent()}
      </div>

    </ThemedView>
  );
}
