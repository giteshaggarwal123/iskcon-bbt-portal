
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Eye, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentAnalyticsProps {
  documentId: string;
  documentName: string;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ 
  documentId, 
  documentName 
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get view count and recent activity
      const { data: views, error: viewsError } = await supabase
        .from('document_views')
        .select('*')
        .eq('document_id', documentId);

      if (viewsError) throw viewsError;

      const totalViews = views?.length || 0;
      const recentViews = views?.filter(view => {
        const viewDate = new Date(view.view_started_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return viewDate >= sevenDaysAgo;
      }).length || 0;

      setAnalytics({
        totalViews,
        recentViews,
        lastViewed: views && views.length > 0 ? views[views.length - 1].view_started_at : null
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load document analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 px-2"
          onClick={fetchAnalytics}
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Document Analytics</span>
          </DialogTitle>
          <DialogDescription>
            Analytics for "{documentName}"
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Total Views</span>
                  </CardDescription>
                  <CardTitle className="text-2xl">{analytics.totalViews}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Recent Views</span>
                  </CardDescription>
                  <CardTitle className="text-2xl">{analytics.recentViews}</CardTitle>
                  <CardDescription className="text-xs">Last 7 days</CardDescription>
                </CardHeader>
              </Card>
            </div>
            
            {analytics.lastViewed && (
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Last Viewed</CardDescription>
                  <CardTitle className="text-sm">
                    {new Date(analytics.lastViewed).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            
            <div className="pt-2">
              <Badge variant="outline" className="text-xs">
                {analytics.totalViews > 0 ? 'Active document' : 'No views yet'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No analytics data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
