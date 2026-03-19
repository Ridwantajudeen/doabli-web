import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedComponents';
import ClientHome from './client/ClientHome';
import ClientMyErrands from './client/ClientMyErrands';
import ClientMessages from './client/ClientMessages';
import ClientNotifications from './client/ClientNotifications';
import ClientProfile from './client/ClientProfile';
import Support from './Support';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import BrandLogo from '../components/BrandLogo';
import { useLocation } from 'react-router-dom';

function useUnreadCount(userId) {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['unread-count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // fallback polling every 30s
  });

  // Real-time updates to the badge
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`client-unread:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-count', userId] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);

  return count;
}

export default function ClientDashboard() {
  const { theme, Colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const unreadCount = useUnreadCount(user?.id);

  // Clear badge when user opens the notifications tab
  const queryClient = useQueryClient();
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    if (tabId === 'notifications') {
      // Optimistically clear the badge - the actual mark-as-read happens in the notifications page
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
      }, 2000);
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/client/errands')) setActiveTab('errands');
    else if (path.startsWith('/client/messages')) setActiveTab('messages');
    else if (path.startsWith('/client/notifications')) setActiveTab('notifications');
    else if (path.startsWith('/client/profile')) setActiveTab('profile');
    else if (path.startsWith('/client')) setActiveTab('home');
  }, [location.pathname]);

  const tabs = [
    { id: 'home',          label: 'Home' },
    { id: 'errands',       label: 'My Errands' },
    { id: 'messages',      label: 'Messages' },
    { id: 'notifications', label: 'Notifications', badge: unreadCount },
    { id: 'profile',       label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':          return <ClientHome />;
      case 'errands':       return <ClientMyErrands />;
      case 'messages':      return <ClientMessages />;
      case 'notifications': return <ClientNotifications />;
      case 'profile':       return <ClientProfile onOpenSupport={() => handleTabChange('support')} />;
      case 'support':       return <Support />;
      default:              return <ClientHome />;
    }
  };

  return (
    <ThemedView style={{ backgroundColor: theme.background, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAVBAR */}
      <nav
        className="px-4 py-3 md:px-6 md:py-4"
        style={{
          width: '100%',
          backgroundColor: theme.navBackground,
          borderBottom: `1px solid ${theme.uiBackground}`,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <BrandLogo width={110} height={28} />

        {/* DESKTOP NAV */}
        <div className="hidden md:flex gap-6 items-center" style={{ marginLeft: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? Colors.primary : theme.text,
                fontSize: '16px', fontWeight: activeTab === tab.id ? '600' : '400',
                transition: '0.2s', position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  backgroundColor: '#ef4444', color: 'white',
                  borderRadius: '10px', padding: '1px 7px',
                  fontSize: '11px', fontWeight: '700', lineHeight: '18px',
                  minWidth: '18px', textAlign: 'center',
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border transition"
            style={{
              borderColor: theme.uiBackground,
              color: theme.text,
            }}
            aria-label="Toggle theme"
            type="button"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* MOBILE HAMBURGER */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            className="md:hidden p-2 bg-zinc-800 text-white rounded-full"
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          {/* Red dot on hamburger when there are unread notifications */}
          {unreadCount > 0 && !mobileMenuOpen && (
            <span style={{
              position: 'absolute', top: '0px', right: '0px',
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: '#ef4444', border: '2px solid white',
            }} />
          )}
        </div>
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
              top: '64px',
              left: '12px',
              right: '12px',
              backgroundColor: theme.navBackground,
              border: `1px solid ${theme.uiBackground}`,
              borderRadius: '16px',
              padding: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: activeTab === tab.id ? theme.uiBackground : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '15px',
                  color: activeTab === tab.id ? Colors.primary : theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 8px',
                  borderRadius: '10px',
                }}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444', color: 'white',
                    borderRadius: '10px', padding: '1px 7px',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={toggleTheme}
              style={{
                background: theme.uiBackground,
                border: 'none',
                textAlign: 'left',
                fontSize: '15px',
                color: theme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 8px',
                borderRadius: '10px',
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
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

