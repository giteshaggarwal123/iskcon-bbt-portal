
import { supabase } from '@/integrations/supabase/client';

export class SecurityService {
  // Generate dynamic session storage key
  static generateSessionKey(): string {
    return `sb-${window.location.hostname}-auth-token-${Date.now()}`;
  }

  // Validate session token format
  static validateSessionToken(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3; // JWT format
    } catch {
      return false;
    }
  }

  // Get Microsoft OAuth configuration securely
  static async getMicrosoftOAuthConfig() {
    try {
      const { data, error } = await supabase.functions.invoke('get-oauth-config');
      
      if (error) {
        console.error('Failed to get OAuth config:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching OAuth config:', error);
      return null;
    }
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  // Validate phone number format
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
