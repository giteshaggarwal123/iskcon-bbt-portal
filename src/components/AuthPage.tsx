
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Phone, Shield, Clock } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
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
              {step === 'phone' 
                ? 'Enter your registered mobile number to receive OTP'
                : 'Enter the 6-digit OTP sent to your mobile'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendOTP}
                  disabled={!phoneNumber || loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">OTP sent to {phoneNumber}</span>
                  <button 
                    onClick={() => setStep('phone')}
                    className="text-primary hover:underline"
                  >
                    Change number
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
                  <button className="text-sm text-gray-600 hover:text-primary">
                    Resend OTP in <span className="font-medium">30s</span>
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
                  <p>OTP expires in 5 minutes. For security reasons, only authorized bureau members can access this platform.</p>
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
