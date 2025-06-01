
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Email {
  id: string;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  body: string;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: string;
}

export const useEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEmails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user has Microsoft tokens
      const { data: profile } = await supabase
        .from('profiles')
        .select('microsoft_access_token, token_expires_at')
        .eq('id', user.id)
        .single();

      if (!profile?.microsoft_access_token) {
        toast({
          title: "Microsoft Account Required",
          description: "Please connect your Microsoft account in Settings to view emails",
          variant: "destructive"
        });
        return;
      }

      // Check if token is still valid
      if (new Date(profile.token_expires_at) <= new Date()) {
        toast({
          title: "Token Expired",
          description: "Your Microsoft token has expired. Please reconnect your account in Settings",
          variant: "destructive"
        });
        return;
      }

      // Fetch emails from Microsoft Graph
      const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc', {
        headers: {
          'Authorization': `Bearer ${profile.microsoft_access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emails from Microsoft Graph');
      }

      const data = await response.json();
      
      const formattedEmails: Email[] = data.value.map((email: any) => ({
        id: email.id,
        subject: email.subject || 'No Subject',
        from: {
          name: email.from?.emailAddress?.name || 'Unknown Sender',
          address: email.from?.emailAddress?.address || ''
        },
        body: email.body?.content || '',
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        importance: email.importance
      }));

      setEmails(formattedEmails);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error Fetching Emails",
        description: error.message || "Failed to load emails from Outlook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (emailData: {
    subject: string;
    body: string;
    recipients: string[];
    attachments?: any[];
  }) => {
    if (!user) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-outlook-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully",
      });

      // Refresh emails after sending
      fetchEmails();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to Send Email",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('microsoft_access_token')
        .eq('id', user.id)
        .single();

      if (!profile?.microsoft_access_token) return;

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${profile.microsoft_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isRead: true
        })
      });

      if (response.ok) {
        setEmails(prev => prev.map(email => 
          email.id === emailId ? { ...email, isRead: true } : email
        ));
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmails();
    }
  }, [user]);

  return {
    emails,
    loading,
    sending,
    fetchEmails,
    sendEmail,
    markAsRead
  };
};
