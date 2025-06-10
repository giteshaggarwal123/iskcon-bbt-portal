
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

      if (documentType === 'document') {
        // For regular documents, create a view record in document_views
        const { error } = await supabase
          .from('document_views')
          .insert({
            document_id: documentId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            view_started_at: new Date().toISOString(),
            time_spent_seconds: 0,
            completion_percentage: 0,
            last_page_viewed: 1
          });

        if (error) {
          console.error('Error tracking document view:', error);
        }
      } else if (documentType === 'meeting_attachment') {
        // For meeting attachments, increment view_count
        const { error } = await supabase.rpc('increment_view_count', {
          table_name: 'meeting_attachments',
          attachment_id: documentId
        });

        if (error) {
          console.error('Error tracking meeting attachment view:', error);
          // Fallback to direct update
          await supabase
            .from('meeting_attachments')
            .update({ view_count: supabase.sql`view_count + 1` })
            .eq('id', documentId);
        }
      } else if (documentType === 'poll_attachment') {
        // For poll attachments, increment view_count
        const { error } = await supabase.rpc('increment_view_count', {
          table_name: 'poll_attachments',
          attachment_id: documentId
        });

        if (error) {
          console.error('Error tracking poll attachment view:', error);
          // Fallback to direct update
          await supabase
            .from('poll_attachments')
            .update({ view_count: supabase.sql`view_count + 1` })
            .eq('id', documentId);
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

      if (documentType === 'meeting_attachment') {
        const { error } = await supabase.rpc('increment_download_count', {
          table_name: 'meeting_attachments',
          attachment_id: documentId
        });

        if (error) {
          console.error('Error tracking meeting attachment download:', error);
          // Fallback to direct update
          await supabase
            .from('meeting_attachments')
            .update({ download_count: supabase.sql`download_count + 1` })
            .eq('id', documentId);
        }
      } else if (documentType === 'poll_attachment') {
        const { error } = await supabase.rpc('increment_download_count', {
          table_name: 'poll_attachments',
          attachment_id: documentId
        });

        if (error) {
          console.error('Error tracking poll attachment download:', error);
          // Fallback to direct update
          await supabase
            .from('poll_attachments')
            .update({ download_count: supabase.sql`download_count + 1` })
            .eq('id', documentId);
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
