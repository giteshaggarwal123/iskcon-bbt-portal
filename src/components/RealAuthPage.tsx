
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Shield, Lock, Phone, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const RealAuthPage: React.FC = () => {
  const { signIn, sendLoginOTP, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'login' | 'otp-verification'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    otp: ''
  });
  const [storedOTP, setStoredOTP] = useState('');
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '', rememberMe: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [otpSentTime, setOtpSentTime] = useState<Date | null>(null);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Store credentials for later use
      setLoginCredentials({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      console.log('Sending OTP for email:', formData.email);
      
      // Send OTP for verification
      const { error, otp } = await sendLoginOTP(formData.email);
      
      console.log('SendLoginOTP response:', { error, otp });
      
      if (error) {
        console.error('Failed to send OTP:', error);
        setDebugInfo({ 
          status: 'error', 
          error: error.details || error.message,
          timestamp: new Date().toLocaleString()
        });
        toast({
          title: "Failed to send OTP",
          description: error.details || error.message || "Please check your email and try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (otp) {
        console.log('OTP sent successfully, received OTP:', otp);
        setStoredOTP(otp);
        setOtpSentTime(new Date());
        setDebugInfo({
          status: 'success',
          message: 'OTP sent successfully via Twilio',
          timestamp: new Date().toLocaleString(),
          phoneNumber: 'ending in ***5090', // Masked for security
          otpCode: otp // Temporarily showing for debugging
        });
        setStep('otp-verification');
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code."
        });
      } else {
        setDebugInfo({
          status: 'error',
          error: 'No OTP received from server',
          timestamp: new Date().toLocaleString()
        });
        toast({
          title: "No OTP received",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in login process:', error);
      setDebugInfo({
        status: 'error',
        error: `Unexpected error: ${error}`,
        timestamp: new Date().toLocaleString()
      });
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Verifying OTP:', formData.otp, 'Expected:', storedOTP);
      
      // Verify OTP
      if (formData.otp !== storedOTP) {
        console.error('OTP mismatch');
        toast({
          title: "Invalid OTP",
          description: "Please check the code and try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('OTP verified successfully, attempting login');
      
      // OTP is correct, proceed with login
      const { error } = await signIn(
        loginCredentials.email, 
        loginCredentials.password, 
        loginCredentials.rememberMe
      );
      
      if (error) {
        console.error('Login failed after OTP verification:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive"
        });
      } else {
        console.log('Login successful!');
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        // Reset form
        setFormData({
          email: '',
          password: '',
          rememberMe: false,
          otp: ''
        });
        setStoredOTP('');
        setStep('login');
        setDebugInfo(null);
        setOtpSentTime(null);
      }
    } catch (error) {
      console.error('Error in OTP verification:', error);
      toast({
        title: "Verification Error",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetToLogin = () => {
    setStep('login');
    setFormData(prev => ({ ...prev, otp: '' }));
    setStoredOTP('');
    setIsSubmitting(false);
    setDebugInfo(null);
    setOtpSentTime(null);
  };

  const handleResendOTP = async () => {
    setIsSubmitting(true);
    try {
      console.log('Resending OTP for:', loginCredentials.email);
      const { error, otp } = await sendLoginOTP(loginCredentials.email);
      
      console.log('Resend OTP response:', { error, otp });
      
      if (!error && otp) {
        console.log('OTP resent successfully, new OTP:', otp);
        setStoredOTP(otp);
        setOtpSentTime(new Date());
        setFormData(prev => ({ ...prev, otp: '' }));
        setDebugInfo({
          status: 'success',
          message: 'OTP resent successfully via Twilio',
          timestamp: new Date().toLocaleString(),
          phoneNumber: 'ending in ***5090',
          otpCode: otp // Temporarily showing for debugging
        });
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your phone."
        });
      } else {
        setDebugInfo({
          status: 'error',
          error: error?.details || 'Failed to resend OTP',
          timestamp: new Date().toLocaleString()
        });
        toast({
          title: "Failed to resend OTP",
          description: error?.details || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setDebugInfo({
        status: 'error',
        error: `Resend error: ${error}`,
        timestamp: new Date().toLocaleString()
      });
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate time since OTP was sent
  const getTimeSinceOTP = () => {
    if (!otpSentTime) return '';
    const seconds = Math.floor((new Date().getTime() - otpSentTime.getTime()) / 1000);
    return `${seconds} seconds ago`;
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

        {/* Debug Information */}
        {debugInfo && (
          <Alert className={`mb-6 ${debugInfo.status === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <div><strong>Status:</strong> {debugInfo.status}</div>
                <div><strong>Time:</strong> {debugInfo.timestamp}</div>
                {debugInfo.message && <div><strong>Message:</strong> {debugInfo.message}</div>}
                {debugInfo.error && <div><strong>Error:</strong> {debugInfo.error}</div>}
                {debugInfo.phoneNumber && <div><strong>Phone:</strong> {debugInfo.phoneNumber}</div>}
                {debugInfo.otpCode && <div><strong>Debug OTP:</strong> {debugInfo.otpCode}</div>}
                {otpSentTime && <div><strong>Sent:</strong> {getTimeSinceOTP()}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>
                {step === 'otp-verification' ? 'Verify OTP' : 'Secure Login'}
              </span>
            </CardTitle>
            <CardDescription>
              {step === 'login' && 'Enter your credentials to continue'}
              {step === 'otp-verification' && 'Enter the OTP sent to your registered mobile number'}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => updateFormData('rememberMe', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading || isSubmitting || !formData.email || !formData.password}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Sending OTP...' : 'Continue to OTP'}
                </Button>
              </form>
            ) : (
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
                    <p className="text-xs text-gray-500">
                      Phone: +91***75090
                    </p>
                    {storedOTP && (
                      <p className="text-xs text-blue-600 mt-2">
                        Debug: If SMS doesn't arrive, the code is: {storedOTP}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">Enter Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={formData.otp}
                        onChange={(value) => updateFormData('otp', value)}
                        disabled={isSubmitting}
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
                  disabled={loading || isSubmitting || formData.otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="flex items-center text-gray-600 hover:text-primary"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-primary hover:underline"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
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
