import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Shield, Lock, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';

export const RealAuthPage: React.FC = () => {
  const { signIn, sendLoginOTP, verifyLoginOTP, sendOTP, verifyOTP, loading } = useAuth();
  const [step, setStep] = useState<'login' | 'otp-verification' | 'forgot-phone' | 'forgot-otp' | 'forgot-newPassword'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    phoneNumber: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPassword, setForgotPassword] = useState(false);
  const [storedOTP, setStoredOTP] = useState('');
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '', rememberMe: false });
  const [userExists, setUserExists] = useState(false);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword) {
      setStep('forgot-phone');
    } else {
      // Store credentials and send OTP for login verification
      setLoginCredentials({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      console.log('Checking if user exists and sending OTP for email:', formData.email);
      
      // First check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, phone, first_name, last_name')
        .eq('email', formData.email)
        .single();

      if (profileError || !profile) {
        console.error('User not found in profiles:', profileError);
        alert('User not found. Please contact administrator to add your profile to the system.');
        return;
      }

      // Check if user exists in Supabase auth by trying to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (!signInError && signInData.user) {
        console.log('User exists in auth, signing out to proceed with OTP flow');
        setUserExists(true);
        // Sign out immediately to continue with OTP flow
        await supabase.auth.signOut();
      } else {
        console.log('User does not exist in auth or invalid password, will create account after OTP');
        setUserExists(false);
      }

      const { error, otp } = await sendLoginOTP(formData.email);
      if (!error && otp) {
        console.log('OTP sent successfully, stored OTP:', otp);
        setStoredOTP(otp);
        setStep('otp-verification');
      } else {
        console.error('Failed to send OTP:', error);
        alert('Failed to send OTP. Please try again.');
      }
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== OTP Verification Debug ===');
    console.log('Email:', loginCredentials.email);
    console.log('Input OTP:', formData.otp);
    console.log('Stored OTP:', storedOTP);
    console.log('User exists in auth:', userExists);
    
    // Verify OTP matches
    if (formData.otp !== storedOTP) {
      console.error('OTP mismatch - Input:', formData.otp, 'Expected:', storedOTP);
      alert('Invalid OTP. Please check the code and try again.');
      return;
    }

    console.log('OTP verified successfully');

    try {
      if (userExists) {
        // User exists in auth, try to sign in
        console.log('User exists in auth, attempting sign in');
        const { error } = await signIn(loginCredentials.email, loginCredentials.password, loginCredentials.rememberMe);
        
        if (error) {
          console.error('Login error after OTP verification:', error);
          alert(`Login failed: ${error.message || 'Invalid credentials. Please check your email and password.'}`);
        } else {
          console.log('Login successful!');
          // Reset form data on successful login
          setFormData({
            email: '',
            password: '',
            rememberMe: false,
            phoneNumber: '',
            otp: '',
            newPassword: '',
            confirmPassword: ''
          });
          setStoredOTP('');
        }
      } else {
        // User doesn't exist in auth, create account
        console.log('User does not exist in auth, creating account');
        
        // Get user profile for metadata
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('email', loginCredentials.email)
          .single();

        const { error } = await supabase.auth.signUp({
          email: loginCredentials.email,
          password: loginCredentials.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              phone: profile?.phone || ''
            }
          }
        });

        if (error) {
          console.error('Sign up error:', error);
          alert(`Account creation failed: ${error.message}`);
        } else {
          console.log('Account created successfully, now signing in');
          // Now sign in with the new account
          const { error: signInError } = await signIn(loginCredentials.email, loginCredentials.password, loginCredentials.rememberMe);
          
          if (signInError) {
            console.error('Sign in error after account creation:', signInError);
            alert(`Sign in failed after account creation: ${signInError.message}`);
          } else {
            console.log('Sign in successful after account creation!');
            // Reset form data on successful login
            setFormData({
              email: '',
              password: '',
              rememberMe: false,
              phoneNumber: '',
              otp: '',
              newPassword: '',
              confirmPassword: ''
            });
            setStoredOTP('');
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error during authentication:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleSendForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error, otp } = await sendOTP(formData.phoneNumber);
    if (!error && otp) {
      setStoredOTP(otp);
      setStep('forgot-otp');
    }
  };

  const handleVerifyForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp === storedOTP) {
      setStep('forgot-newPassword');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    const { error } = await verifyOTP(formData.email, formData.otp, formData.newPassword);
    if (!error) {
      setStep('login');
      setForgotPassword(false);
      setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '', otp: '', phoneNumber: '' }));
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetToLogin = () => {
    setStep('login');
    setForgotPassword(false);
    setFormData(prev => ({ ...prev, otp: '', phoneNumber: '', newPassword: '', confirmPassword: '' }));
    setStoredOTP('');
  };

  const handleResendOTP = async () => {
    console.log('Resending OTP...');
    if (step === 'otp-verification') {
      console.log('Resending login OTP for:', loginCredentials.email);
      const { error, otp } = await sendLoginOTP(loginCredentials.email);
      if (!error && otp) {
        console.log('New OTP sent:', otp);
        setStoredOTP(otp);
        // Clear the current OTP input
        setFormData(prev => ({ ...prev, otp: '' }));
      }
    } else if (step === 'forgot-otp') {
      const { error, otp } = await sendOTP(formData.phoneNumber);
      if (!error && otp) {
        setStoredOTP(otp);
        setFormData(prev => ({ ...prev, otp: '' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img 
              src="/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png" 
              alt="ISKCON Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ISKCON Bureau</h1>
          <p className="text-gray-600">Management Platform</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>
                {step === 'otp-verification' ? 'Verify OTP' : 
                 step.startsWith('forgot-') ? 'Reset Password' : 'Secure Login'}
              </span>
            </CardTitle>
            <CardDescription>
              {step === 'login' && !forgotPassword && 'Enter your credentials to sign in'}
              {step === 'login' && forgotPassword && 'Enter your email to reset password'}
              {step === 'otp-verification' && 'Enter the OTP sent to your registered mobile number'}
              {step === 'forgot-phone' && 'Enter your registered mobile number'}
              {step === 'forgot-otp' && 'Enter the OTP sent to your mobile'}
              {step === 'forgot-newPassword' && 'Set your new password'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleInitialLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@iskconbureau.in"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                {!forgotPassword && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => updateFormData('rememberMe', checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm">Remember me</Label>
                    </div>
                  </>
                )}
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Processing...' : forgotPassword ? 'Continue' : 'Continue to OTP'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setForgotPassword(!forgotPassword)}
                    className="text-sm text-primary hover:underline"
                  >
                    {forgotPassword ? 'Back to Login' : 'Forgot Password?'}
                  </button>
                </div>
              </form>
            ) : step === 'otp-verification' ? (
              <form onSubmit={handleOTPVerification} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      We've sent a 6-digit verification code to your registered mobile number
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Email: {loginCredentials.email}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">Enter Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={formData.otp}
                        onChange={(value) => updateFormData('otp', value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="flex items-center text-gray-600 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </form>
            ) : step === 'forgot-phone' ? (
              <form onSubmit={handleSendForgotOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter your registered phone number to receive OTP</p>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="text-sm text-gray-600 hover:text-primary"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : step === 'forgot-otp' ? (
              <form onSubmit={handleVerifyForgotOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code sent to {formData.phoneNumber}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={formData.otp}
                        onChange={(value) => updateFormData('otp', value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('forgot-phone')}
                    className="flex items-center text-gray-600 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => updateFormData('newPassword', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2024 ISKCON Bureau Management Platform</p>
          <p>Secure • Reliable • Confidential</p>
        </div>
      </div>
    </div>
  );
};
