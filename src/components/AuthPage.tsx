
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
  const { sendLoginOTP, verifyLoginOTP, signIn, loading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [storedOTP, setStoredOTP] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async () => {
    if (!email) return;
    
    const { error, otp: receivedOTP } = await sendLoginOTP(email);
    
    if (!error && receivedOTP) {
      setStoredOTP(receivedOTP);
      setStep('otp');
      // Extract masked phone from response if available
      const response = await fetch(`https://daiimiznlkffbbadhodw.supabase.co/functions/v1/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaWltaXpubGtmZmJiYWRob2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzgxMTIsImV4cCI6MjA2NDM1NDExMn0.gPvDe0Pfx5avJGvA5uLOi59pjodaCoTI2c17MIST9dA`
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          // Extract phone number from message for display
          const phoneMatch = data.message.match(/(\+91\*+\d{5})/);
          if (phoneMatch) {
            setMaskedPhone(phoneMatch[1]);
          }
        }
      }
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) return;
    
    const { error } = await signIn(email, password, rememberMe);
    if (!error) {
      onLogin();
    }
  };

  const handleVerifyOTP = async () => {
    if (otp === storedOTP) {
      const { error } = await verifyLoginOTP(email, otp);
      if (!error) {
        onLogin();
      }
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    const { error, otp: newOTP } = await sendLoginOTP(email);
    if (!error && newOTP) {
      setStoredOTP(newOTP);
      setOtp('');
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
              <span>Secure Login</span>
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? loginMethod === 'otp' 
                  ? 'Enter your registered email to receive OTP on your mobile'
                  : 'Sign in with your email and password'
                : 'Enter the 6-digit OTP sent to your registered mobile number'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'email' ? (
              <div className="space-y-4">
                {/* Login Method Toggle */}
                <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setLoginMethod('otp')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      loginMethod === 'otp'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    OTP Login
                  </button>
                  <button
                    onClick={() => setLoginMethod('password')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      loginMethod === 'password'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Password Login
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@iskconbureau.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {loginMethod === 'otp' && (
                    <p className="text-xs text-gray-500">
                      OTP will be sent to the mobile number registered with this email
                    </p>
                  )}
                </div>

                {loginMethod === 'password' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm">Remember me for 30 days</Label>
                    </div>
                  </>
                )}
                
                <Button 
                  onClick={loginMethod === 'otp' ? handleSendOTP : handlePasswordLogin}
                  disabled={!email || (loginMethod === 'password' && !password) || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Processing...' : loginMethod === 'otp' ? 'Send OTP' : 'Sign In'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
                        value={otp}
                        onChange={(value) => setOtp(value)}
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
                  <span className="text-gray-600">Code sent to {email}</span>
                  <button 
                    onClick={() => setStep('email')}
                    className="text-primary hover:underline"
                  >
                    Change email
                  </button>
                </div>
                
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
                
                <div className="text-center">
                  <button 
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Security Note */}
            <div className="bg-secondary/50 rounded-lg p-3 border">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    {loginMethod === 'otp' 
                      ? 'OTP expires in 5 minutes. Only registered bureau members with verified mobile numbers can access this platform.'
                      : 'Only registered bureau members can access this platform. Enable "Remember me" to stay logged in for 30 days.'
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
