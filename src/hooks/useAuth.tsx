
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<{ error: any; otp?: string }>;
  sendLoginOTP: (email: string) => Promise<{ error: any; otp?: string }>;
  verifyOTP: (email: string, otp: string, newPassword: string) => Promise<{ error: any }>;
  verifyLoginOTP: (email: string, otp: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Memoized function to fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted && session) {
          setSession(session);
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const sendOTP = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phoneNumber }
      });

      if (error) {
        toast({
          title: "OTP Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code."
      });

      return { error: null, otp: data.otp };
    } catch (error: any) {
      toast({
        title: "OTP Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const sendLoginOTP = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-login-otp', {
        body: { email }
      });

      if (error) {
        toast({
          title: "OTP Error",
          description: error.details || "Failed to send verification code. Please try again.",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Verification Code Sent",
        description: data.message || "Please check your phone for the verification code."
      });

      return { error: null, otp: data.otp };
    } catch (error: any) {
      toast({
        title: "OTP Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const verifyOTP = async (email: string, otp: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password Reset Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Password Reset Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const verifyLoginOTP = async (email: string, otp: string) => {
    try {
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear state even if there's an error
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out."
      });
    }
  };

  const value = {
    user,
    session,
    userProfile,
    signUp,
    signIn,
    signOut,
    sendOTP,
    sendLoginOTP,
    verifyOTP,
    verifyLoginOTP,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
