import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityService } from '@/services/securityService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<{ error: any }>;
  sendLoginOTP: (email: string) => Promise<{ error: any }>;
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
      // Clear any stored session using dynamic key
      const sessionKey = SecurityService.generateSessionKey();
      localStorage.removeItem(sessionKey);
      sessionStorage.removeItem(sessionKey);
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        // Validate session token if present
        if (session?.access_token && !SecurityService.validateSessionToken(session.access_token)) {
          console.warn('Invalid session token detected');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Only set session if remember me is enabled or session is fresh
        if (session && (shouldPersist || isSessionFresh(session))) {
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
        } else if (session) {
          // Validate session token
          if (session.access_token && !SecurityService.validateSessionToken(session.access_token)) {
            console.warn('Invalid session token in auth state change');
            await supabase.auth.signOut();
            return;
          }
          
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
      // Input validation
      if (!SecurityService.validateEmail(email)) {
        const error = { message: 'Invalid email format' };
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (phone && !SecurityService.validatePhoneNumber(phone)) {
        const error = { message: 'Invalid phone number format' };
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: SecurityService.sanitizeInput(email),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: SecurityService.sanitizeInput(firstName),
            last_name: SecurityService.sanitizeInput(lastName),
            phone: phone ? SecurityService.sanitizeInput(phone) : undefined
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
      // Input validation
      if (!SecurityService.validateEmail(email)) {
        const error = { message: 'Invalid email format' };
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Clear any existing remember me settings first
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');

      const { error } = await supabase.auth.signInWithPassword({
        email: SecurityService.sanitizeInput(email),
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
      if (!SecurityService.validatePhoneNumber(phoneNumber)) {
        const error = { message: 'Invalid phone number format' };
        toast({
          title: "OTP Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phoneNumber: SecurityService.sanitizeInput(phoneNumber) }
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

      return { error: null };
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
      if (!SecurityService.validateEmail(email)) {
        const error = { message: 'Invalid email format' };
        toast({
          title: "OTP Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      const { data, error } = await supabase.functions.invoke('send-login-otp', {
        body: { email: SecurityService.sanitizeInput(email) }
      });

      if (error) {
        toast({
          title: "OTP Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code."
      });

      return { error: null };
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
      // Verify OTP using secure backend
      const { data, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { 
          email: SecurityService.sanitizeInput(email), 
          otp: SecurityService.sanitizeInput(otp), 
          type: 'reset' 
        }
      });

      if (verifyError || data.error) {
        toast({
          title: "OTP Verification Error",
          description: data?.error || "Invalid or expired OTP",
          variant: "destructive"
        });
        return { error: verifyError || data };
      }

      // If OTP is verified, update password
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
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          email: SecurityService.sanitizeInput(email), 
          otp: SecurityService.sanitizeInput(otp), 
          type: 'login' 
        }
      });

      if (error || data.error) {
        toast({
          title: "Verification Error",
          description: data?.error || "Invalid or expired OTP",
          variant: "destructive"
        });
        return { error: error || data };
      }

      // After successful OTP verification, sign in using magic link
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: SecurityService.sanitizeInput(email),
        options: {
          shouldCreateUser: false
        }
      });

      if (magicLinkError) {
        console.error('Magic link signin failed:', magicLinkError);
        toast({
          title: "Authentication Error",
          description: "Failed to complete authentication. Please try again.",
          variant: "destructive"
        });
        return { error: magicLinkError };
      }

      toast({
        title: "Success",
        description: "OTP verified successfully! You are now logged in.",
      });

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
      // Clear remember me settings
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');

      if (!session) {
        console.log('No active session found, clearing local state');
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
