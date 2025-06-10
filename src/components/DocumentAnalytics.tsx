
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, Download, Clock, BarChart3 } from 'lucide-react';
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
  totalDownloads: number;
  viewsByDay: Array<{ date: string; views: number; downloads: number }>;
  memberAnalytics: Array<{ name: string; views: number; downloads: number; lastAccess: string; timeSpent: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

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
      
      // Fetch member-wise analytics from the new table
      const { data: memberData, error: memberError } = await supabase
        .from('document_analytics')
        .select(`
          user_id,
          action_type,
          created_at,
          device_type,
          profiles!inner(first_name, last_name)
        `)
        .eq('document_id', documentId)
        .eq('document_type', documentType);

      if (memberError) {
        console.error('Error fetching member analytics:', memberError);
      }

      console.log('Member analytics data:', memberData);

      // Fetch time spent data for documents
      let timeSpentData: any[] = [];
      if (documentType === 'document') {
        const { data: timeData, error: timeError } = await supabase
          .from('document_views')
          .select(`
            user_id,
            time_spent_seconds,
            profiles!inner(first_name, last_name)
          `)
          .eq('document_id', documentId);

        if (!timeError && timeData) {
          timeSpentData = timeData;
        }
      }

      // Process member analytics
      const memberStats: { [key: string]: { name: string; views: number; downloads: number; lastAccess: string; timeSpent: number } } = {};
      
      if (memberData) {
        memberData.forEach((record: any) => {
          const userId = record.user_id;
          const userName = `${record.profiles.first_name || ''} ${record.profiles.last_name || ''}`.trim() || 'Unknown User';
          
          if (!memberStats[userId]) {
            memberStats[userId] = {
              name: userName,
              views: 0,
              downloads: 0,
              lastAccess: record.created_at,
              timeSpent: 0
            };
          }

          if (record.action_type === 'view') {
            memberStats[userId].views++;
          } else if (record.action_type === 'download') {
            memberStats[userId].downloads++;
          }

          // Update last access to the most recent
          if (new Date(record.created_at) > new Date(memberStats[userId].lastAccess)) {
            memberStats[userId].lastAccess = record.created_at;
          }
        });
      }

      // Add time spent data for documents
      if (timeSpentData.length > 0) {
        timeSpentData.forEach((record: any) => {
          const userId = record.user_id;
          if (memberStats[userId]) {
            memberStats[userId].timeSpent += record.time_spent_seconds || 0;
          }
        });
      }

      const memberAnalytics = Object.values(memberStats)
        .sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));

      // Get device breakdown
      const deviceStats: { [key: string]: number } = {};
      if (memberData) {
        memberData.forEach((record: any) => {
          const device = record.device_type || 'Unknown';
          deviceStats[device] = (deviceStats[device] || 0) + 1;
        });
      }

      const deviceBreakdown = Object.entries(deviceStats).map(([device, count]) => ({
        device,
        count
      }));

      // Get totals based on document type
      let totalViews = 0;
      let totalDownloads = 0;

      if (documentType === 'meeting_attachment') {
        const { data: fileData, error } = await supabase
          .from('meeting_attachments')
          .select('view_count, download_count')
          .eq('id', documentId)
          .single();

        if (!error && fileData) {
          totalViews = fileData.view_count || 0;
          totalDownloads = fileData.download_count || 0;
        }
      } else if (documentType === 'poll_attachment') {
        const { data: fileData, error } = await supabase
          .from('poll_attachments')
          .select('view_count, download_count')
          .eq('id', documentId)
          .single();

        if (!error && fileData) {
          totalViews = fileData.view_count || 0;
          totalDownloads = fileData.download_count || 0;
        }
      } else {
        // For regular documents, count from member analytics
        totalViews = memberData?.filter(r => r.action_type === 'view').length || 0;
        totalDownloads = memberData?.filter(r => r.action_type === 'download').length || 0;
      }

      // Generate daily data from member analytics
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = memberData?.filter(r => 
          r.action_type === 'view' && r.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayDownloads = memberData?.filter(r => 
          r.action_type === 'download' && r.created_at.startsWith(dateStr)
        ).length || 0;

        days.push({
          date: format(date, 'MMM dd'),
          views: dayViews,
          downloads: dayDownloads
        });
      }

      setAnalytics({
        totalViews,
        totalDownloads,
        viewsByDay: days,
        memberAnalytics,
        deviceBreakdown
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        totalViews: 0,
        totalDownloads: 0,
        viewsByDay: [],
        memberAnalytics: [],
        deviceBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getDocumentTypeLabel()} Analytics
          </DialogTitle>
          <DialogDescription>
            Member-wise viewing and engagement statistics for "{documentName}"
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
                    <Download className="h-4 w-4" />
                    Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
                </CardContent>
              </Card>
            </div>

            {/* Member-wise Analytics */}
            {analytics.memberAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Member Activity</CardTitle>
                  <CardDescription>Individual member engagement with this {documentType.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.memberAnalytics.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Last access: {format(new Date(member.lastAccess), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3 text-blue-600" />
                            <span>{member.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3 text-green-600" />
                            <span>{member.downloads}</span>
                          </div>
                          {member.timeSpent > 0 && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-orange-600" />
                              <span>{formatTime(member.timeSpent)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Views Over Time */}
            {analytics.viewsByDay.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Over Time (Last 7 Days)</CardTitle>
                  <CardDescription>Daily views and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.viewsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} name="Views" />
                      <Line type="monotone" dataKey="downloads" stroke="#82ca9d" strokeWidth={2} name="Downloads" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Device Breakdown */}
            {analytics.deviceBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Device Usage</CardTitle>
                  <CardDescription>How members access this content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* No Data Message */}
            {analytics.totalViews === 0 && analytics.totalDownloads === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No member activity yet</p>
                <p className="text-sm mt-2">Member views and downloads will appear here once users interact with this {documentType.replace('_', ' ').toLowerCase()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Failed to load analytics data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
