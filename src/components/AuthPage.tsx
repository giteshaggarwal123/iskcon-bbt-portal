
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Phone, Shield, Clock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const { sendLoginOTP, verifyLoginOTP, loading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [storedOTP, setStoredOTP] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  const handleSendOTP = async () => {
    if (!email) return;
    
    const { error, otp: receivedOTP } = await sendLoginOTP(email);
    
    if (!error && receivedOTP) {
      setStoredOTP(receivedOTP);
      setStep('otp');
      // Extract masked phone from response if available
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
              <span>Secure OTP Login</span>
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your registered email to receive OTP on your mobile'
                : 'Enter the 6-digit OTP sent to your registered mobile number'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'email' ? (
              <div className="space-y-4">
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
                  <p className="text-xs text-gray-500">
                    OTP will be sent to the mobile number registered with this email
                  </p>
                </div>
                
                <Button 
                  onClick={handleSendOTP}
                  disabled={!email || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
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
                  <p>OTP expires in 5 minutes. Only registered bureau members with verified mobile numbers can access this platform.</p>
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
