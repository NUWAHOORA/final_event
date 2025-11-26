import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'staff' | 'student';

export interface AuthUser extends User {
  role?: UserRole;
}

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  department?: string
) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        role,
        department
      }
    }
  });

  if (error) return { data: null, error };
  
  // Role is automatically created by database trigger
  return { data, error: null };
};

export const signIn = async (email: string, password: string) => {
  // First check if user is approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('email', email)
    .maybeSingle();

  if (profile && !profile.is_approved) {
    return { 
      data: null, 
      error: { 
        message: "Your account is pending admin approval. You'll receive login details by email once approved.",
        name: "AccountNotApproved",
        status: 403
      } as any
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as UserRole;
};

export const getCurrentUser = async (): Promise<{ user: AuthUser | null; session: Session | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { user: null, session: null };
  }

  const role = await getUserRole(session.user.id);
  
  return {
    user: { ...session.user, role: role || undefined },
    session
  };
};