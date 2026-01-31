import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedComponents';
import RunnerHome from './runner/RunnerHome';
import RunnerApplications from './runner/RunnerApplications';
import RunnerMessages from './runner/RunnerMessages';
import RunnerNotifications from './runner/RunnerNotifications';
import RunnerProfile from './runner/RunnerProfile';
import { Menu, X } from 'lucide-react';

export default function RunnerDashboard() {
  const { theme, Colors } = useTheme();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Available Jobs' },
    { id: 'applications', label: 'Applied' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <RunnerHome />;
      case 'applications': return <RunnerApplications />;
      case 'messages': return <RunnerMessages />;
      case 'notifications': return <RunnerNotifications />;
      case 'profile': return <RunnerProfile />;
      default: return <RunnerHome />;
    }
  };

  return (
    <ThemedView
      style={{
        backgroundColor: theme.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* NAV */}
      <nav
        className="w-full flex justify-between items-center px-6 py-4 sticky top-0 z-50"
        style={{
          backgroundColor: theme.navBackground,
          borderBottom: `1px solid ${theme.uiBackground}`,
        }}
      >
        <h2
          className="text-xl font-bold"
          style={{ color: Colors.primary }}
        >
          Errandly
        </h2>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="transition"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? Colors.primary : theme.text,
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: Colors.warning }}
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '60px',
              right: '16px',
              width: '160px',
              backgroundColor: theme.navBackground,
              border: `1px solid ${theme.uiBackground}`,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
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
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="p-5 flex-1">
        {renderContent()}
      </div>
    </ThemedView>
  );
}
