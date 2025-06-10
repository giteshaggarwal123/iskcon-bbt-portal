
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Eye, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { format } from 'date-fns';

interface DocumentAnalyticsProps {
  documentId: string;
  documentName: string;
  documentType?: 'document' | 'meeting_attachment' | 'poll_attachment';
}

interface AnalyticsData {
  totalViews: number;
  totalTimeSpent: number;
  memberAnalytics: Array<{ 
    name: string; 
    views: number; 
    timeSpent: number; 
    lastViewed: string;
  }>;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ 
  documentId, 
  documentName,
  documentType = 'document'
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics for:', documentType, documentId);
      
      // Fetch member-wise analytics with proper join
      const { data: memberData, error: memberError } = await supabase
        .from('document_analytics')
        .select(`
          user_id,
          action_type,
          created_at
        `)
        .eq('document_id', documentId)
        .eq('document_type', documentType);

      if (memberError) {
        console.error('Error fetching member analytics:', memberError);
      }

      console.log('Member analytics data:', memberData);

      // Fetch user profiles separately
      let profilesData: any[] = [];
      if (memberData && memberData.length > 0) {
        const userIds = [...new Set(memberData.map(record => record.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (!profilesError && profiles) {
          profilesData = profiles;
        }
      }

      // Fetch time spent data for documents
      let timeSpentData: any[] = [];
      if (documentType === 'document') {
        const { data: timeData, error: timeError } = await supabase
          .from('document_views')
          .select(`
            user_id,
            time_spent_seconds
          `)
          .eq('document_id', documentId);

        if (!timeError && timeData) {
          timeSpentData = timeData;
        }
      }

      // Process member analytics
      const memberStats: { [key: string]: { name: string; views: number; timeSpent: number; lastViewed: string } } = {};
      
      if (memberData) {
        memberData.forEach((record: any) => {
          const userId = record.user_id;
          const profile = profilesData.find(p => p.id === userId);
          const userName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User';
          
          if (!memberStats[userId]) {
            memberStats[userId] = {
              name: userName,
              views: 0,
              timeSpent: 0,
              lastViewed: record.created_at
            };
          }

          if (record.action_type === 'view') {
            memberStats[userId].views++;
          }

          // Update last viewed to the most recent
          if (new Date(record.created_at) > new Date(memberStats[userId].lastViewed)) {
            memberStats[userId].lastViewed = record.created_at;
          }
        });
      }

      // Add time spent data for documents
      if (timeSpentData.length > 0) {
        timeSpentData.forEach((record: any) => {
          const userId = record.user_id;
          const profile = profilesData.find(p => p.id === userId);
          const userName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User';
          
          if (memberStats[userId]) {
            memberStats[userId].timeSpent += record.time_spent_seconds || 0;
          } else {
            // Create entry if user has time spent but no view record in analytics
            memberStats[userId] = {
              name: userName,
              views: 0,
              timeSpent: record.time_spent_seconds || 0,
              lastViewed: new Date().toISOString()
            };
          }
        });
      }

      const memberAnalytics = Object.values(memberStats)
        .sort((a, b) => b.views - a.views);

      // Calculate totals
      const totalViews = memberAnalytics.reduce((sum, member) => sum + member.views, 0);
      const totalTimeSpent = memberAnalytics.reduce((sum, member) => sum + member.timeSpent, 0);

      setAnalytics({
        totalViews,
        totalTimeSpent,
        memberAnalytics
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        totalViews: 0,
        totalTimeSpent: 0,
        memberAnalytics: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${remainingSeconds}s`;
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'meeting_attachment':
        return 'Meeting Attachment';
      case 'poll_attachment':
        return 'Poll Attachment';
      default:
        return 'Document';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(true);
            fetchAnalytics();
          }}
          className="h-8 px-2"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Analytics
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {getDocumentTypeLabel()} Analytics
          </DialogTitle>
          <DialogDescription>
            Analytics for "{documentName}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Total Time Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(analytics.totalTimeSpent)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Member Analytics Table */}
            {analytics.memberAnalytics.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Member Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Time Spent</TableHead>
                        <TableHead>Last Viewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.memberAnalytics.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.views}</TableCell>
                          <TableCell>{formatTime(member.timeSpent)}</TableCell>
                          <TableCell>
                            {format(new Date(member.lastViewed), 'MMM d, hh:mm a')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No member activity yet</p>
                <p className="text-sm mt-2">Member views and activity will appear here once users interact with this {documentType.replace('_', ' ').toLowerCase()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Failed to load analytics data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
