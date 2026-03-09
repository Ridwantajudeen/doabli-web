//lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUpUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
};

export const exchangeRecoveryCode = async (code) => {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new Error(error.message);
    }
    return { session: data.session, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
};

export const updateUserPassword = async (password) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return { session: data.session, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
};

// Profile helpers
export const createProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: profileData.email,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone_number: profileData.phone,
          role: profileData.role,
        },
      ])
      .select();

    if (error) {
      console.error('Profile creation error:', error);
      throw new Error(error.message);
    }

    return { profile: data?.[0] || null, error: null };
  } catch (err) {
    console.error('Create profile exception:', err.message);
    return { profile: null, error: err.message };
  }
};

export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return { profile: data || null, error: null };
  } catch (err) {
    return { profile: null, error: err.message };
  }
};

export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw new Error(error.message);

    return { profile: data[0], error: null };
  } catch (err) {
    return { profile: null, error: err.message };
  }
};

// Get runners with services
export const getRunners = async () => {
  try {
    // Fetch profiles (runners)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, average_rating, avatar_url')
      .eq('role', 'runner')
      .order('average_rating', { ascending: false });

    if (profilesError) throw new Error(profilesError.message);

    // Fetch all services using runner_id
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, runner_id, title, price');

    if (servicesError) throw new Error(servicesError.message);

    // Attach services to each runner
    const runnersWithServices = (profilesData || []).map(runner => ({
      ...runner,
      services: (servicesData || []).filter(s => s.runner_id === runner.id)
    }));

    return { data: runnersWithServices, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};
