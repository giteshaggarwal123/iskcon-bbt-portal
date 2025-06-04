
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Shield, Lock, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const RealAuthPage: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    otp: ''
  });
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword) {
      // Send OTP via Twilio (placeholder for now)
      alert('OTP sent to your registered phone number');
      setStep('otp');
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verify OTP and proceed with password reset (placeholder)
    alert('OTP verified. Please set new password.');
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          </CardHeader>
          
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@iskcon.org"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                {!forgotPassword && (
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
                )}

                {!forgotPassword && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => updateFormData('rememberMe', checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm">Remember me (30 days)</Label>
                  </div>
                )}
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Processing...' : forgotPassword ? 'Send OTP' : 'Sign In'}
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
            ) : (
              <form onSubmit={handleOtpVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={formData.otp}
                      onChange={(e) => updateFormData('otp', e.target.value)}
                      maxLength={6}
                      className="pl-10 text-center text-lg tracking-widest"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="text-sm text-gray-600 hover:text-primary"
                  >
                    Back to Login
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
