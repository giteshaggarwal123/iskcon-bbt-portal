
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, User, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentAnalyticsProps {
  documentId: string;
  documentName: string;
}

interface ViewData {
  user_id: string;
  view_started_at: string;
  view_ended_at: string | null;
  time_spent_seconds: number;
  completion_percentage: number;
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
      // Get detailed view data with time spent information
      const { data: views, error: viewsError } = await supabase
        .from('document_views')
        .select('*')
        .eq('document_id', documentId)
        .order('view_started_at', { ascending: false });

      if (viewsError) {
        console.error('Error fetching views:', viewsError);
        // Don't throw error, just show basic analytics
      }

      const viewData: ViewData[] = views || [];
      
      // Calculate analytics focused on time spent
      const totalTimeSpent = viewData.reduce((total, view) => total + (view.time_spent_seconds || 0), 0);
      const totalViews = viewData.length;
      const averageTimeSpent = totalViews > 0 ? totalTimeSpent / totalViews : 0;
      
      // Get unique users who viewed the document
      const uniqueUsers = [...new Set(viewData.map(view => view.user_id))];
      
      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentViews = viewData.filter(view => {
        const viewDate = new Date(view.view_started_at);
        return viewDate >= sevenDaysAgo;
      });
      
      const recentTimeSpent = recentViews.reduce((total, view) => total + (view.time_spent_seconds || 0), 0);

      setAnalytics({
        totalViews,
        totalTimeSpent,
        averageTimeSpent,
        recentViews: recentViews.length,
        recentTimeSpent,
        uniqueViewers: uniqueUsers.length,
        lastViewed: viewData.length > 0 ? viewData[0].view_started_at : null,
        viewDetails: viewData.slice(0, 5), // Show last 5 views
        hasData: viewData.length > 0
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      // Set basic analytics even if there's an error
      setAnalytics({
        totalViews: 0,
        totalTimeSpent: 0,
        averageTimeSpent: 0,
        recentViews: 0,
        recentTimeSpent: 0,
        uniqueViewers: 0,
        lastViewed: null,
        viewDetails: [],
        hasData: false
      });
      
      toast({
        title: "Analytics Warning",
        description: "Analytics data may be incomplete due to database configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            fetchAnalytics();
          }}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Document Analytics</span>
          </DialogTitle>
          <DialogDescription>
            View analytics for "{documentName}"
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            {analytics.hasData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Total Time</span>
                      </CardDescription>
                      <CardTitle className="text-xl">{formatDuration(analytics.totalTimeSpent)}</CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Avg. Time</span>
                      </CardDescription>
                      <CardTitle className="text-xl">{formatDuration(Math.round(analytics.averageTimeSpent))}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Total Views</span>
                      </CardDescription>
                      <CardTitle className="text-xl">{analytics.totalViews}</CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Unique Viewers</span>
                      </CardDescription>
                      <CardTitle className="text-xl">{analytics.uniqueViewers}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Recent Activity (7 days)</CardDescription>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{analytics.recentViews} views</div>
                      <div className="text-sm text-gray-600">{formatDuration(analytics.recentTimeSpent)} total time</div>
                    </div>
                  </CardHeader>
                </Card>
                
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
                    {analytics.totalViews > 0 ? `Active document - ${analytics.uniqueViewers} unique viewers` : 'No views yet'}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3 text-center">
                    <Eye className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <CardDescription>No Analytics Data Available</CardDescription>
                    <div className="text-sm text-gray-500">
                      This document hasn't been viewed yet, or analytics tracking needs to be configured.
                    </div>
                  </CardHeader>
                </Card>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Views</CardDescription>
                      <CardTitle className="text-xl">0</CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Time Spent</CardDescription>
                      <CardTitle className="text-xl">0s</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Analytics will appear after first view
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Click to load analytics data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
