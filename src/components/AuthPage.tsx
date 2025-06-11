
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Shield, Clock, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const { signIn, sendLoginOTP, verifyLoginOTP, loading } = useAuth();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [storedOTP, setStoredOTP] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [verifiedCredentials, setVerifiedCredentials] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    console.log('Verifying credentials for:', formData.email);
    
    // First verify email/password with Supabase
    const { error: signInError } = await signIn(formData.email, formData.password, false); // Don't persist yet
    
    if (signInError) {
      console.error('Credentials verification failed:', signInError);
      return; // Error will be shown by toast in useAuth
    }

    console.log('Credentials verified, sending OTP...');
    setVerifiedCredentials(true);

    // Now send OTP to registered mobile
    const { error: otpError, otp } = await sendLoginOTP(formData.email);
    
    if (otpError) {
      console.error('OTP sending failed:', otpError);
      setVerifiedCredentials(false);
      return;
    }

    if (otp) {
      setStoredOTP(otp);
      setStep('otp');
      
      // Extract masked phone from the response message if available
      try {
        const response = await fetch(`https://daiimiznlkffbbadhodw.supabase.co/functions/v1/send-login-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaWltaXpubGtmZmJiYWRob2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzgxMTIsImV4cCI6MjA2NDM1NDExMn0.gPvDe0Pfx5avJGvA5uLOi59pjodaCoTI2c17MIST9dA`
          },
          body: JSON.stringify({ email: formData.email })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.message) {
            const phoneMatch = data.message.match(/(\+91\*+\d{5})/);
            if (phoneMatch) {
              setMaskedPhone(phoneMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error('Error extracting masked phone:', error);
      }
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.otp.length !== 6) {
      return;
    }

    console.log('Verifying OTP:', formData.otp);
    
    // Verify OTP matches
    if (formData.otp === storedOTP) {
      console.log('OTP verified, completing login...');
      
      // Complete the login process with remember me option
      const { error } = await signIn(formData.email, formData.password, formData.rememberMe);
      
      if (!error) {
        onLogin();
      }
    } else {
      console.error('Invalid OTP provided');
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!verifiedCredentials) {
      return;
    }
    
    console.log('Resending OTP for:', formData.email);
    const { error, otp } = await sendLoginOTP(formData.email);
    
    if (!error && otp) {
      setStoredOTP(otp);
      setFormData(prev => ({ ...prev, otp: '' }));
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setStep('credentials');
    setFormData({ email: '', password: '', otp: '', rememberMe: false });
    setVerifiedCredentials(false);
    setStoredOTP('');
    setMaskedPhone('');
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
              <span>Secure Login</span>
            </CardTitle>
            <CardDescription>
              {step === 'credentials' 
                ? 'Enter your email and password to continue'
                : 'Enter the 6-digit OTP sent to your registered mobile number'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                  <Label htmlFor="remember" className="text-sm">Remember me for 30 days</Label>
                </div>
                
                <Button 
                  type="submit"
                  disabled={!formData.email || !formData.password || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Continue to OTP'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  OTP will be sent to the mobile number registered with your email
                </p>
              </form>
            ) : (
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code sent to {maskedPhone || 'your registered mobile'}
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
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Code sent to {formData.email}</span>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="text-primary hover:underline"
                  >
                    Change details
                  </button>
                </div>
                
                <Button 
                  type="submit"
                  disabled={formData.otp.length !== 6 || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading || !verifiedCredentials}
                    className="text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Security Note */}
            <div className="bg-secondary/50 rounded-lg p-3 border">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    {step === 'credentials' 
                      ? 'Your credentials will be verified before sending OTP to your registered mobile number.'
                      : 'OTP expires in 5 minutes. Only registered bureau members can access this platform.'
                    }
                  </p>
                </div>
              </div>
            </div>
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
