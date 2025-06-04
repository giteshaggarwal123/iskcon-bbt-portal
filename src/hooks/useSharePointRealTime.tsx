
import { useEffect, useRef } from 'react';
import { useSharePoint } from './useSharePoint';
import { useToast } from './use-toast';

interface UseSharePointRealTimeOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
}

export const useSharePointRealTime = (options: UseSharePointRealTimeOptions = {}) => {
  const { enabled = true, pollInterval = 30000 } = options; // Default 30 seconds
  const { documents, currentSiteId, fetchDocuments } = useSharePoint();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDocumentCountRef = useRef<number>(0);
  const lastModifiedRef = useRef<string>('');

  const checkForUpdates = async () => {
    if (!currentSiteId || !enabled) return;

    try {
      // Store current state before fetching
      const currentCount = documents.length;
      const currentLastModified = documents.length > 0 
        ? Math.max(...documents.map(doc => new Date(doc.lastModifiedDateTime).getTime())).toString()
        : '';

      // Fetch latest documents
      await fetchDocuments();

    } catch (error) {
      console.error('Real-time sync error:', error);
    }
  };

  // Detect changes and show notifications
  useEffect(() => {
    const currentCount = documents.length;
    const currentLastModified = documents.length > 0 
      ? Math.max(...documents.map(doc => new Date(doc.lastModifiedDateTime).getTime())).toString()
      : '';

    // Skip first run
    if (lastDocumentCountRef.current === 0 && lastModifiedRef.current === '') {
      lastDocumentCountRef.current = currentCount;
      lastModifiedRef.current = currentLastModified;
      return;
    }

    // Check for new documents
    if (currentCount > lastDocumentCountRef.current) {
      toast({
        title: "New Documents Added",
        description: `${currentCount - lastDocumentCountRef.current} new document(s) added to SharePoint`,
      });
    }

    // Check for modified documents
    if (currentLastModified !== lastModifiedRef.current && currentCount === lastDocumentCountRef.current) {
      toast({
        title: "Documents Updated",
        description: "Documents have been modified in SharePoint",
      });
    }

    lastDocumentCountRef.current = currentCount;
    lastModifiedRef.current = currentLastModified;
  }, [documents, toast]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !currentSiteId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkForUpdates();

    // Set up interval
    intervalRef.current = setInterval(checkForUpdates, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, currentSiteId, pollInterval]);

  return {
    isRealTimeEnabled: enabled,
    pollInterval,
  };
};
