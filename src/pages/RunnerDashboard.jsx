import { useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

function useUnreadCount(userId) {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['runner-unread-count', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false);
      return data?.length ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`runner-unread:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['runner-unread-count', userId] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);

  return count;
}

export default function RunnerDashboard() {
  const { theme, Colors } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const unreadCount = useUnreadCount(user?.id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    if (tabId === 'notifications') {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['runner-unread-count', user?.id] });
      }, 2000);
    }
  };

  const tabs = [
    { id: 'home',          label: 'Available Jobs' },
    { id: 'applications',  label: 'Applied' },
    { id: 'messages',      label: 'Messages' },
    { id: 'notifications', label: 'Notifications', badge: unreadCount },
    { id: 'profile',       label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':          return <RunnerHome />;
      case 'applications':  return <RunnerApplications />;
      case 'messages':      return <RunnerMessages />;
      case 'notifications': return <RunnerNotifications />;
      case 'profile':       return <RunnerProfile />;
      default:              return <RunnerHome />;
    }
  };

  return (
    <ThemedView style={{ backgroundColor: theme.background, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <nav
        className="w-full flex justify-between items-center px-6 py-4 sticky top-0 z-50"
        style={{ backgroundColor: theme.navBackground, borderBottom: `1px solid ${theme.uiBackground}` }}
      >
        <h2 className="text-xl font-bold" style={{ color: Colors.primary }}>Errandly</h2>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="transition"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? Colors.primary : theme.text,
                fontWeight: activeTab === tab.id ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: '6px',
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
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: Colors.warning }}
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div style={{ position: 'relative' }}>
          <button
            className="md:hidden p-2 bg-zinc-800 text-white rounded-full"
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: '60px', right: '16px', width: '180px',
              backgroundColor: theme.navBackground, border: `1px solid ${theme.uiBackground}`,
              borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column',
              gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: 'none', border: 'none', textAlign: 'left', fontSize: '14px',
                  color: activeTab === tab.id ? Colors.primary : theme.text, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                marginTop: '8px', padding: '6px', backgroundColor: Colors.warning,
                border: 'none', color: '#fff', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
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