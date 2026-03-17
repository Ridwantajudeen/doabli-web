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

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
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

export const exchangeAuthCode = async (code) => {
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

export const recordPolicyAcceptance = async ({
  userId,
  policyType,
  policyVersion,
  source = 'web',
  method = 'checkbox',
  userAgent = null,
  ipAddress = null,
}) => {
  if (!userId || !policyType || !policyVersion) {
    return { error: 'Missing policy acceptance fields' };
  }
  try {
    const payload = {
      user_id: userId,
      policy_type: policyType,
      policy_version: policyVersion,
      accepted_at: new Date().toISOString(),
      user_agent: userAgent,
      ip_address: ipAddress,
      source,
      method,
    };

    const { error } = await supabase
      .from('policy_acceptances')
      .upsert([payload], { onConflict: 'user_id,policy_type,policy_version' });

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err.message };
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
          user_id: userId,
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

export const getProfile = async (userId, userEmail) => {
  try {
    // Prefer legacy mapping: profiles.id === auth user id
    const { data: byId, error: byIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!byIdError && byId) {
      return { profile: byId, error: null };
    }

    if (byIdError && byIdError.code !== 'PGRST116') {
      throw new Error(byIdError.message);
    }

    // Fallback: profiles.user_id mapping (if present)
    const { data: byUserId, error: byUserIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!byUserIdError && byUserId) {
      return { profile: byUserId, error: null };
    }

    if (byUserIdError && byUserIdError.code !== 'PGRST116') {
      throw new Error(byUserIdError.message);
    }

    // Try matching by email for existing profiles
    if (userEmail) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byEmailError && byEmailError.code !== 'PGRST116') {
        throw new Error(byEmailError.message);
      }

      if (byEmail) {
        return { profile: byEmail, error: null };
      }
    }

    return { profile: null, error: null };
  } catch (err) {
    return { profile: null, error: err.message };
  }
};

export const updateProfile = async (userId, updates) => {
  try {
    // Prefer update by id (legacy mapping), fallback to user_id
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    if (data && data.length > 0) {
      return { profile: data[0], error: null };
    }

    const { data: byIdData, error: byIdError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select();

    if (byIdError) throw new Error(byIdError.message);

    return { profile: byIdData?.[0] || null, error: null };
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
