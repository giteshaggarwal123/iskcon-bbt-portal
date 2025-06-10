
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Eye, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentAnalyticsProps {
  documentId: string;
  documentName: string;
}

interface MemberAnalytics {
  user_id: string;
  user_name: string;
  total_views: number;
  total_time_spent: number;
  last_viewed: string;
}

interface AnalyticsData {
  totalViews: number;
  totalTimeSpent: number;
  memberAnalytics: MemberAnalytics[];
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ 
  documentId, 
  documentName 
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalTimeSpent: 0,
    memberAnalytics: []
  });
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics for document:', documentId);
      
      // First, get all document views for this document
      const { data: viewsData, error: viewsError } = await supabase
        .from('document_views')
        .select('*')
        .eq('document_id', documentId);

      if (viewsError) {
        console.error('Error fetching document views:', viewsError);
        throw viewsError;
      }

      console.log('Document views data:', viewsData);

      // Get all unique user IDs from the views
      const userIds = [...new Set(viewsData?.map(view => view.user_id) || [])];
      
      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Process the data to get member-by-member analytics
      const memberMap = new Map<string, MemberAnalytics>();
      
      viewsData?.forEach(view => {
        const userId = view.user_id;
        const profile = profilesMap.get(userId);
        const userName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
          : 'Unknown User';
        
        if (memberMap.has(userId)) {
          const existing = memberMap.get(userId)!;
          existing.total_views += 1;
          existing.total_time_spent += view.time_spent_seconds || 0;
          if (new Date(view.view_started_at) > new Date(existing.last_viewed)) {
            existing.last_viewed = view.view_started_at;
          }
        } else {
          memberMap.set(userId, {
            user_id: userId,
            user_name: userName,
            total_views: 1,
            total_time_spent: view.time_spent_seconds || 0,
            last_viewed: view.view_started_at
          });
        }
      });

      const memberAnalytics = Array.from(memberMap.values()).sort((a, b) => b.total_views - a.total_views);
      const totalViews = viewsData?.length || 0;
      const totalTimeSpent = viewsData?.reduce((sum, view) => sum + (view.time_spent_seconds || 0), 0) || 0;

      console.log('Processed analytics:', { totalViews, totalTimeSpent, memberAnalytics });

      setAnalytics({
        totalViews,
        totalTimeSpent,
        memberAnalytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data on error but don't show error to user
      setAnalytics({
        totalViews: 0,
        totalTimeSpent: 0,
        memberAnalytics: []
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Analytics</DialogTitle>
          <DialogDescription>
            Analytics for "{documentName}"
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Total Time Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(analytics.totalTimeSpent)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Member-by-Member Analytics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Member Analytics
              </h3>
              
              {analytics.memberAnalytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No analytics data available yet
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Time Spent</TableHead>
                        <TableHead className="text-center">Last Viewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.memberAnalytics.map((member) => (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-medium">
                            {member.user_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.total_views}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDuration(member.total_time_spent)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDate(member.last_viewed)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
