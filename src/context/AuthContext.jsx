// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  signUpUser,
  loginUser,
  signInWithGoogle,
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

  const isEmailVerified = (authUser) =>
    Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at || authUser?.user_metadata?.email_verified);

  const buildProfileSeed = (authUser) => {
    const meta = authUser?.user_metadata || {};
    return {
      email: authUser?.email || meta.email || "",
      firstName: meta.first_name || meta.firstName || "",
      lastName: meta.last_name || meta.lastName || "",
      phone: meta.phone_number || meta.phone || "",
      role: meta.role || "client",
    };
  };

  // ✅ Load profile with timeout and auto-create if missing
  const loadProfileAsync = async (authUser) => {
    if (!authUser?.id) return null;
    if (!isEmailVerified(authUser)) {
      setProfile(null);
      return null;
    }

    // Use a non-throwing timeout so we don't reject the race and cause an exception.
    // If fetching takes too long, the timeout will resolve with a null profile result.
    const timeoutMs = 10000; // increase timeout to 10s for slow networks
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ profile: null, error: 'timeout' }), timeoutMs)
    );

    try {
      const { profile: fetched, error } = await Promise.race([
        getProfile(authUser.id, authUser.email),
        timeoutPromise,
      ]);

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (!fetched) {
        // ✅ Auto-create profile if it doesn't exist
        const seed = buildProfileSeed(authUser);
        const { profile: newProfile, error: createError } = await createProfile(authUser.id, seed);
        if (createError) {
          console.error("Error creating profile:", createError);
          return null;
        }
        setProfile(newProfile);
        return newProfile;
      }

      setProfile(fetched);
      return fetched;
    } catch (err) {
      console.error("Profile load error:", err);
      return null;
    }
  };

  // ✅ Init session and listen to auth changes
  useEffect(() => {
    const init = async () => {
      try {
        const { session } = await getCurrentSession();
        if (session?.user) {
          setUser(session.user);
          await loadProfileAsync(session.user);
        }
      } catch (err) {
        console.error("Init session error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setProfileLoading(true);
          try {
            await loadProfileAsync(session.user);
          } finally {
            setProfileLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Explicit profile loader (callable)
  const loadProfile = async (authUser) => {
    if (!authUser?.id) return null;
    setProfileLoading(true);
    try {
      return await loadProfileAsync(authUser);
    } finally {
      setProfileLoading(false);
    }
  };

  // Auth Functions
  const signup = async (email, password, userData) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await signUpUser(email, password, userData);
      if (error) return { error };
      return { user: authUser, profile: null };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await loginUser(email, password);
      if (error) {
        const normalized = String(error || '').toLowerCase();
        if (normalized.includes('email') && normalized.includes('confirm')) {
          return { error: "EMAIL_NOT_VERIFIED" };
        }
        return { error };
      }

      if (!isEmailVerified(authUser)) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        return { error: "EMAIL_NOT_VERIFIED" };
      }

      setUser(authUser);

      // ✅ Auto-create profile if missing
      const fetchedProfile = await loadProfileAsync(authUser);

      return { user: authUser, profile: fetchedProfile };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) return { error };
      return { error: null };
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (p) =>
    Boolean(p?.first_name && p?.last_name && p?.phone_number && p?.role);

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
        isEmailVerified,
        signup,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
        loadProfile,
        isProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
