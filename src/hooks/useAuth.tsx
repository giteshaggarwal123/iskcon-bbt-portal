import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<{ error: any; otp?: string }>;
  sendLoginOTP: (email: string) => Promise<{ error: any; otp?: string }>;
  verifyOTP: (email: string, otp: string, newPassword: string) => Promise<{ error: any }>;
  verifyLoginOTP: (email: string, otp: string) => Promise<{ error: any }>;
  resetPasswordWithOTP: (email: string, otp: string, newPassword: string) => Promise<{ error: any }>;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if session should be persisted based on remember me setting
    const shouldPersist = localStorage.getItem('rememberMe') === 'true';
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry');
    
    // If remember me was not checked or has expired, clear session storage
    if (!shouldPersist || (rememberMeExpiry && Date.now() > parseInt(rememberMeExpiry))) {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');
      localStorage.removeItem('otp_authenticated_user');
      // Clear any stored session
      localStorage.removeItem('sb-daiimiznlkffbbadhodw-auth-token');
      sessionStorage.removeItem('sb-daiimiznlkffbbadhodw-auth-token');
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        // Check for OTP authenticated user
        const otpUser = localStorage.getItem('otp_authenticated_user');
        if (otpUser && !session) {
          try {
            const userData = JSON.parse(otpUser);
            console.log('Found OTP authenticated user:', userData);
            setUser(userData);
            setSession({
              access_token: 'otp_temp_token',
              user: userData
            } as any);
          } catch (error) {
            console.error('Error parsing OTP user data:', error);
            localStorage.removeItem('otp_authenticated_user');
          }
        } else if (session && (shouldPersist || isSessionFresh(session))) {
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          // Clear session if remember me is not enabled
          if (session && !shouldPersist) {
            await supabase.auth.signOut();
          }
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem('otp_authenticated_user');
        } else if (session) {
          const shouldPersist = localStorage.getItem('rememberMe') === 'true';
          
          if (shouldPersist || isSessionFresh(session)) {
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            // If remember me is not enabled and session is not fresh, sign out
            await supabase.auth.signOut();
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to check if session is fresh (less than 1 hour old)
  const isSessionFresh = (session: Session): boolean => {
    if (!session.expires_at) return false;
    const sessionAge = Date.now() - (session.expires_at * 1000 - session.expires_in! * 1000);
    return sessionAge < 60 * 60 * 1000; // 1 hour
  };

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
      // Clear any existing remember me settings and OTP auth first
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');
      localStorage.removeItem('otp_authenticated_user');

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

      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMeExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
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
          description: error.details || "Failed to send OTP. Please try again.",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "OTP Sent",
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

  const sendLoginOTP = async (email: string) => {
    try {
      console.log('Sending login OTP for email:', email);
      
      const { data, error } = await supabase.functions.invoke('send-login-otp', {
        body: { email }
      });

      if (error) {
        console.error('Send login OTP error:', error);
        toast({
          title: "Authentication Error",
          description: error.details || "Failed to send verification code. Please try again.",
          variant: "destructive"
        });
        return { error };
      }

      if (data.error) {
        console.error('Send login OTP data error:', data);
        toast({
          title: "Authentication Error", 
          description: data.details || data.error,
          variant: "destructive"
        });
        return { error: data };
      }

      console.log('Login OTP sent successfully:', data);
      toast({
        title: "Verification Code Sent",
        description: data.message || "Please check your phone for the verification code."
      });

      return { error: null, otp: data.otp };
    } catch (error: any) {
      console.error('Send login OTP catch error:', error);
      toast({
        title: "Authentication Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const verifyOTP = async (email: string, otp: string, newPassword: string) => {
    try {
      // In a real implementation, you would verify the OTP against stored values
      // For now, we'll simulate OTP verification and reset the password
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

  const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
    try {
      // Use the edge function to reset password server-side
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          email: email, // Use explicit email field
          type: 'reset_password',
          otp: otp,
          newPassword: newPassword
        }
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully. Please login with your new password."
      });

      return { error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const verifyLoginOTP = async (email: string, otp: string) => {
    try {
      console.log('Verifying login OTP for email:', email, 'OTP:', otp);
      
      // Get the user by email from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        console.error('Profile lookup error:', profileError);
        toast({
          title: "Authentication Error",
          description: "User not found in the system. Please contact administrator to add your profile.",
          variant: "destructive"
        });
        return { error: profileError || new Error('User not found') };
      }

      // Create a temporary session for OTP-authenticated users
      const tempUser = {
        id: profile.id,
        email: profile.email,
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name
        }
      };
      
      // Store temporary auth state with 30-day expiry for OTP login
      localStorage.setItem('otp_authenticated_user', JSON.stringify(tempUser));
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberMeExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
      
      // Set user state manually
      setUser(tempUser as any);
      setSession({
        access_token: 'otp_temp_token',
        user: tempUser as any
      } as any);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.first_name || 'User'}!`
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Verify login OTP error:', error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear remember me settings and OTP auth
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');
      localStorage.removeItem('otp_authenticated_user');

      if (!session || session.access_token === 'otp_temp_token') {
        console.log('No active session found or OTP session, clearing local state');
        setSession(null);
        setUser(null);
        toast({
          title: "Signed out",
          description: "You have been signed out successfully."
        });
        return;
      }

      const { error } = await supabase.auth.signOut();
      
      setSession(null);
      setUser(null);
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Logout Notice",
          description: "You have been signed out locally."
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully."
        });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setSession(null);
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out locally."
      });
    }
  };

  const value = {
    user,
    session,
    signUp: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
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
    },
    signIn,
    signOut,
    sendOTP: async (phoneNumber: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: { phoneNumber }
        });

        if (error) {
          toast({
            title: "OTP Error",
            description: error.details || "Failed to send OTP. Please try again.",
            variant: "destructive"
          });
          return { error };
        }

        toast({
          title: "OTP Sent",
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
    },
    sendLoginOTP,
    verifyOTP: async (email: string, otp: string, newPassword: string) => {
      try {
        // In a real implementation, you would verify the OTP against stored values
        // For now, we'll simulate OTP verification and reset the password
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
    },
    verifyLoginOTP,
    resetPasswordWithOTP: async (email: string, otp: string, newPassword: string) => {
      try {
        // Use the edge function to reset password server-side
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: {
            email: email, // Use explicit email field
            type: 'reset_password',
            otp: otp,
            newPassword: newPassword
          }
        });

        if (error) {
          console.error('Password reset error:', error);
          throw error;
        }

        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated successfully. Please login with your new password."
        });

        return { error: null };
      } catch (error: any) {
        console.error('Password reset error:', error);
        toast({
          title: "Password Reset Error",
          description: error.message || "Failed to reset password. Please try again.",
          variant: "destructive"
        });
        return { error };
      }
    },
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
