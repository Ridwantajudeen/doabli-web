import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedComponents';
import RunnerHome from './runner/RunnerHome';
import RunnerApplications from './runner/RunnerApplications';
import RunnerMessages from './runner/RunnerMessages';
import RunnerNotifications from './runner/RunnerNotifications';
import RunnerProfile from './runner/RunnerProfile';

export default function RunnerDashboard() {
  const { theme, Colors } = useTheme();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('home');

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
          borderBottom: `1px solid ${theme.uiBackground}`
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
          onClick={() => setActiveTab(activeTab === 'menu' ? 'home' : 'menu')}
          className="md:hidden text-2xl"
          style={{ color: theme.text }}
        >
          ☰
        </button>
      </nav>

      {/* CONTENT */}
      <div className="p-5 flex-1">
        {renderContent()}
      </div>
    </ThemedView>
  );
}