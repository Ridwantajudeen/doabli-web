// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  signUpUser,
  loginUser,
  logoutUser,
  getCurrentSession,
  getProfile,
  createProfile,
  supabase,
} from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ------------------------------
  // Restore session + auto-refresh
  // ------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        const { session } = await getCurrentSession();
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        }
      } catch (err) {
        console.error("Init session error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Token refresh + login/logout watcher
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------------
  // Lazy profile loader
  // ------------------------------
  const loadProfile = async (userId) => {
    try {
      setProfileLoading(true);
      const { profile: fetched, error } = await getProfile(userId);
      if (error) {
        console.error('Error fetching profile in loadProfile:', error);
        return null;
      }
      if (fetched) setProfile(fetched);
      return fetched || null;
    } catch (err) {
      console.error("Profile load error:", err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // ------------------------------
  // Auth Functions
  // ------------------------------
  const signup = async (email, password, userData) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await signUpUser(email, password);
      if (error) return { error };

      const { profile: newProfile } = await createProfile(authUser.id, {
        email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
      });

      setUser(authUser);
      setProfile(newProfile);

      return { user: authUser, profile: newProfile };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await loginUser(email, password);
      if (error) return { error };

      // load profile and wait for it so callers can use role immediately
      const fetchedProfile = await loadProfile(authUser.id);
      setUser(authUser);

      return { user: authUser, profile: fetchedProfile };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        signup,
        login,
        logout,
        isAuthenticated: !!user,
        loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
