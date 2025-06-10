
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMicrosoftAuth } from './useMicrosoftAuth';

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
  const [deleting, setDeleting] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, isExpired, accessToken, checkAndRefreshToken } = useMicrosoftAuth();

  const fetchEmails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (!isConnected) {
        toast({
          title: "Microsoft Account Required",
          description: "Please connect your Microsoft account in Settings to view emails",
          variant: "destructive"
        });
        return;
      }

      if (isExpired) {
        // Try to refresh the token
        await checkAndRefreshToken();
        return;
      }

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Microsoft access token not available. Please reconnect your account.",
          variant: "destructive"
        });
        return;
      }

      // Fetch emails from Microsoft Graph
      const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          await checkAndRefreshToken();
          return;
        }
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
    if (!user || !accessToken) return;

    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      } else if (response.status === 401) {
        // Token expired, refresh it
        await checkAndRefreshToken();
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!user || !accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please ensure you're logged in and Microsoft account is connected",
        variant: "destructive"
      });
      return false;
    }

    // Add email to deleting state
    setDeleting(prev => [...prev, emailId]);

    try {
      console.log('Deleting email:', emailId);

      // Delete email from Microsoft Graph
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok || response.status === 204) {
        // Successfully deleted on server, update local state
        setEmails(prev => prev.filter(email => email.id !== emailId));
        
        toast({
          title: "Email Deleted",
          description: "Email has been successfully deleted",
        });
        
        return true;
      } else if (response.status === 401) {
        // Token expired, try to refresh and retry
        await checkAndRefreshToken();
        toast({
          title: "Authentication Expired",
          description: "Please try deleting the email again",
          variant: "destructive"
        });
        return false;
      } else if (response.status === 404) {
        // Email not found on server, remove from local state anyway
        setEmails(prev => prev.filter(email => email.id !== emailId));
        toast({
          title: "Email Removed",
          description: "Email was already deleted or moved",
        });
        return true;
      } else {
        // Other error
        const errorData = await response.json().catch(() => ({}));
        console.error('Error deleting email:', response.status, errorData);
        
        toast({
          title: "Delete Failed",
          description: errorData.error?.message || "Failed to delete email from server",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error deleting email:', error);
      
      toast({
        title: "Delete Failed",
        description: error.message || "Network error occurred while deleting email",
        variant: "destructive"
      });
      return false;
    } finally {
      // Remove email from deleting state
      setDeleting(prev => prev.filter(id => id !== emailId));
    }
  };

  const deleteMultipleEmails = async (emailIds: string[]) => {
    if (!user || !accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please ensure you're logged in and Microsoft account is connected",
        variant: "destructive"
      });
      return { success: 0, failed: emailIds.length };
    }

    if (emailIds.length === 0) {
      toast({
        title: "No Emails Selected",
        description: "Please select emails to delete",
        variant: "destructive"
      });
      return { success: 0, failed: 0 };
    }

    // Add all emails to deleting state
    setDeleting(prev => [...prev, ...emailIds]);

    let successCount = 0;
    let failureCount = 0;

    try {
      console.log('Deleting multiple emails:', emailIds.length);

      // Delete emails in parallel with a reasonable concurrency limit
      const deletePromises = emailIds.map(async (emailId) => {
        try {
          const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok || response.status === 204 || response.status === 404) {
            successCount++;
            return { success: true, emailId };
          } else {
            failureCount++;
            return { success: false, emailId, status: response.status };
          }
        } catch (error) {
          failureCount++;
          return { success: false, emailId, error };
        }
      });

      const results = await Promise.all(deletePromises);
      
      // Update local state - remove successfully deleted emails
      const successfullyDeletedIds = results
        .filter(result => result.success)
        .map(result => result.emailId);

      if (successfullyDeletedIds.length > 0) {
        setEmails(prev => prev.filter(email => !successfullyDeletedIds.includes(email.id)));
      }

      // Show appropriate toast based on results
      if (successCount === emailIds.length) {
        toast({
          title: "Emails Deleted",
          description: `Successfully deleted ${successCount} email${successCount === 1 ? '' : 's'}`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successCount} of ${emailIds.length} emails. ${failureCount} failed.`,
        });
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete any emails",
          variant: "destructive"
        });
      }

      return { success: successCount, failed: failureCount };

    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "An error occurred during bulk deletion",
        variant: "destructive"
      });
      return { success: 0, failed: emailIds.length };
    } finally {
      // Remove all emails from deleting state
      setDeleting(prev => prev.filter(id => !emailIds.includes(id)));
    }
  };

  useEffect(() => {
    if (user && isConnected && !isExpired) {
      fetchEmails();
    }
  }, [user, isConnected, isExpired, accessToken]);

  return {
    emails,
    loading,
    sending,
    deleting,
    fetchEmails,
    sendEmail,
    markAsRead,
    deleteEmail,
    deleteMultipleEmails
  };
};
