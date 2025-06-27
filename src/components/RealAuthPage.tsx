import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Shield, Lock, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const RealAuthPage: React.FC = () => {
  const { signIn, sendLoginOTP, sendOTP, resetPasswordWithOTP, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'login' | 'otp' | 'forgot-phone' | 'forgot-otp' | 'forgot-newPassword'>('login');
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
  const [resetEmail, setResetEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [maskedPhoneNumber, setMaskedPhoneNumber] = useState('');
  const [otpRetryCount, setOtpRetryCount] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Add redirect logic when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to dashboard...');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword) {
      // Store the email for password reset
      setResetEmail(formData.email);
      setStep('forgot-phone');
    } else {
      // Send OTP to phone number linked with email
      setLoginEmail(formData.email);
      setOtpRetryCount(0);
      const result = await sendLoginOTP(formData.email);
      if (!result.error) {
        setStep('otp');
        setMaskedPhoneNumber(result.maskedPhone || '');
        toast({
          title: "OTP Sent",
          description: result.maskedPhone ? `Verification code sent to ${result.maskedPhone}` : "Please check your phone for the verification code.",
        });
      } else {
        // Error is already handled in the hook with toast
        console.error('Login OTP error:', result.error);
      }
    }
  };

  const handleVerifyLoginOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    // Now perform the actual login with email and password
    const result = await signIn(formData.email, formData.password, formData.rememberMe);
    if (!result.error) {
      toast({
        title: "Success",
        description: "Login successful! Welcome to ISKCON Bureau.",
      });
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
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    // Use the new resetPasswordWithOTP method
    const { error } = await resetPasswordWithOTP(resetEmail, formData.otp, formData.newPassword);
    if (!error) {
      setStep('login');
      setForgotPassword(false);
      setFormData(prev => ({ 
        ...prev, 
        password: '', 
        newPassword: '', 
        confirmPassword: '', 
        otp: '', 
        phoneNumber: '' 
      }));
      setResetEmail('');
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetToLogin = () => {
    setStep('login');
    setForgotPassword(false);
    setFormData(prev => ({ 
      ...prev, 
      otp: '', 
      phoneNumber: '', 
      newPassword: '', 
      confirmPassword: '' 
    }));
    setResetEmail('');
    setLoginEmail('');
  };

  const handleResendLoginOTP = async () => {
    if (step === 'otp' && loginEmail && otpCooldown === 0) {
      setOtpRetryCount(prev => prev + 1);
      
      // Implement exponential backoff cooldown
      const cooldownTime = Math.min(30 + (otpRetryCount * 15), 120); // Max 2 minutes
      setOtpCooldown(cooldownTime);
      
      const result = await sendLoginOTP(loginEmail);
      if (!result.error) {
        setMaskedPhoneNumber(result.maskedPhone || '');
        toast({
          title: "OTP Resent",
          description: result.maskedPhone ? `New verification code sent to ${result.maskedPhone}` : "A new verification code has been sent to your phone.",
        });
      }
      
      // Start cooldown timer
      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleResendOTP = async () => {
    if (step === 'forgot-otp') {
      const { error, otp } = await sendOTP(formData.phoneNumber);
      if (!error && otp) {
        setStoredOTP(otp);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ISKCON BUREAU</h1>
          <p className="text-gray-600">Management Portal</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>
                {step === 'otp' ? 'Verify OTP' : step.startsWith('forgot-') ? 'Reset Password' : 'Secure Login'}
              </span>
            </CardTitle>
            <CardDescription>
              {step === 'login' && !forgotPassword && 'Enter your credentials to sign in'}
              {step === 'login' && forgotPassword && 'Enter your email to reset password'}
              {step === 'otp' && 'Enter the OTP sent to your registered mobile number'}
              {step === 'forgot-phone' && 'Enter your registered mobile number'}
              {step === 'forgot-otp' && 'Enter the OTP sent to your mobile'}
              {step === 'forgot-newPassword' && 'Set your new password'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
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
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
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
                  {loading ? 'Processing...' : forgotPassword ? 'Continue' : 'Continue'}
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
            ) : step === 'otp' ? (
              <form onSubmit={handleVerifyLoginOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code sent to your registered mobile number
                    </p>
                    {maskedPhoneNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sent to: {maskedPhoneNumber}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Linked with: {loginEmail}
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
                    {otpRetryCount > 0 && (
                      <p className="text-xs text-center text-gray-500">
                        Retry attempt: {otpRetryCount}/5
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="flex items-center text-gray-600 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={handleResendLoginOTP}
                    className="text-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={loading || otpCooldown > 0 || otpRetryCount >= 5}
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 
                     otpRetryCount >= 5 ? 'Max attempts reached' : 'Resend OTP'}
                  </button>
                </div>
                
                {otpRetryCount >= 3 && (
                  <div className="text-center text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Having trouble? Contact administrator if you continue to experience issues.
                  </div>
                )}
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
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => updateFormData('newPassword', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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
          <p>© 2025 ISKCON BUREAU Management Portal</p>
          <p>Secure • Reliable • Confidential</p>
        </div>
      </div>
    </div>
  );
};
