import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedComponents';
import ClientHome from './client/ClientHome';
import ClientMyErrands from './client/ClientMyErrands';
import ClientMessages from './client/ClientMessages';
import ClientNotifications from './client/ClientNotifications';
import ClientProfile from './client/ClientProfile';

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
        <div className="hidden md:flex gap-6 items-center">
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
          <Link to="/admin" style={{ color: theme.text }}>Admin</Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="md:hidden p-2 bg-zinc-800 text-white rounded-full"
          onClick={() => setMobileMenuOpen(prev => !prev)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
     <AnimatePresence>
  {mobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        top: '60px', // just below navbar
        right: '16px', // align to hamburger button
        backgroundColor: theme.navBackground,
        border: `1px solid ${theme.uiBackground}`,
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 100,
        width: '160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
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
            background: 'none',
            border: 'none',
            textAlign: 'left',
            fontSize: '14px',
            color: activeTab === tab.id ? Colors.primary : theme.text,
            cursor: 'pointer'
          }}
        >
          {tab.label}
        </button>
      ))}

      <button
        onClick={() => {
          logout();
          setMobileMenuOpen(false);
        }}
        style={{
          marginTop: '8px',
          padding: '6px',
          backgroundColor: Colors.warning,
          border: 'none',
          color: '#fff',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Logout
      </button>

      <Link
        to="/admin"
        onClick={() => setMobileMenuOpen(false)}
        style={{ marginTop: '4px', fontSize: '14px', color: theme.text }}
      >
        Admin
      </Link>
    </motion.div>
  )}
</AnimatePresence>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '20px' }}>
        {renderContent()}
      </div>
    </ThemedView>
  );
}
