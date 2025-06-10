
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAnalyticsTrackingProps {
  documentId: string;
  documentType: 'document' | 'meeting_attachment' | 'poll_attachment';
}

export const useAnalyticsTracking = ({ documentId, documentType }: UseAnalyticsTrackingProps) => {
  const { toast } = useToast();

  const trackView = async () => {
    try {
      console.log('Tracking view for:', documentType, documentId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Record member-wise analytics
      const { error: analyticsError } = await supabase
        .from('document_analytics')
        .insert({
          document_id: documentId,
          document_type: documentType,
          user_id: user.id,
          action_type: 'view',
          device_type: navigator.platform || 'Unknown',
          user_agent: navigator.userAgent
        });

      if (analyticsError) {
        console.error('Error recording analytics:', analyticsError);
      }

      if (documentType === 'document') {
        // For regular documents, create a view record in document_views
        const { error } = await supabase
          .from('document_views')
          .insert({
            document_id: documentId,
            user_id: user.id,
            view_started_at: new Date().toISOString(),
            time_spent_seconds: 0,
            completion_percentage: 0,
            last_page_viewed: 1
          });

        if (error) {
          console.error('Error tracking document view:', error);
        }
      } else if (documentType === 'meeting_attachment') {
        // For meeting attachments, increment view_count using direct update
        const { error } = await supabase
          .from('meeting_attachments')
          .update({ view_count: supabase.sql`view_count + 1` })
          .eq('id', documentId);

        if (error) {
          console.error('Error tracking meeting attachment view:', error);
        }
      } else if (documentType === 'poll_attachment') {
        // For poll attachments, increment view_count using direct update
        const { error } = await supabase
          .from('poll_attachments')
          .update({ view_count: supabase.sql`view_count + 1` })
          .eq('id', documentId);

        if (error) {
          console.error('Error tracking poll attachment view:', error);
        }
      }

      console.log('View tracked successfully');
    } catch (error) {
      console.error('Error in trackView:', error);
    }
  };

  const trackDownload = async () => {
    try {
      console.log('Tracking download for:', documentType, documentId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Record member-wise analytics
      const { error: analyticsError } = await supabase
        .from('document_analytics')
        .insert({
          document_id: documentId,
          document_type: documentType,
          user_id: user.id,
          action_type: 'download',
          device_type: navigator.platform || 'Unknown',
          user_agent: navigator.userAgent
        });

      if (analyticsError) {
        console.error('Error recording analytics:', analyticsError);
      }

      if (documentType === 'meeting_attachment') {
        const { error } = await supabase
          .from('meeting_attachments')
          .update({ download_count: supabase.sql`download_count + 1` })
          .eq('id', documentId);

        if (error) {
          console.error('Error tracking meeting attachment download:', error);
        }
      } else if (documentType === 'poll_attachment') {
        const { error } = await supabase
          .from('poll_attachments')
          .update({ download_count: supabase.sql`download_count + 1` })
          .eq('id', documentId);

        if (error) {
          console.error('Error tracking poll attachment download:', error);
        }
      }

      console.log('Download tracked successfully');
    } catch (error) {
      console.error('Error in trackDownload:', error);
    }
  };

  return {
    trackView,
    trackDownload
  };
};
