import { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BrandLogo from '../components/BrandLogo';

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
  const { theme, Colors } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = useUnreadCount(user?.id);

  // Clear badge when user opens the notifications tab
  const queryClient = useQueryClient();
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    if (tabId === 'notifications') {
      // Optimistically clear the badge — the actual mark-as-read happens in the notifications page
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
      }, 2000);
    }
  };

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
      case 'profile':       return <ClientProfile />;
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
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <BrandLogo width={110} height={28} />

        {/* DESKTOP NAV */}
        <div className="hidden md:flex gap-6 items-center">
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
            onClick={logout}
            style={{
              marginLeft: '12px', padding: '8px 14px', backgroundColor: Colors.warning,
              border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            }}
          >
            Logout
          </button>
        </div>

        {/* MOBILE HAMBURGER */}
        <div style={{ position: 'relative' }}>
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
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                backgroundColor: Colors.warning,
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                width: '100%',
              }}
            >
              Logout
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

