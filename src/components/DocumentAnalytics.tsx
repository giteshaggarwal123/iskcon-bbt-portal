import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Download, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentAnalyticsProps {
  documentId: string;
  documentName: string;
}

interface DocumentView {
  id: string;
  user_id: string;
  view_started_at: string;
  view_ended_at: string | null;
  time_spent_seconds: number | null;
  completion_percentage: number | null;
  last_page_viewed: number | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ documentId, documentName }) => {
  const [views, setViews] = useState<DocumentView[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_views')
        .select(`
          *,
          profiles!document_views_user_id_fkey(first_name, last_name, email)
        `)
        .eq('document_id', documentId)
        .order('view_started_at', { ascending: false });

      if (error) throw error;
      
      // Type guard to ensure we have the correct data structure
      const typedData = (data || []).map(item => {
        const profiles = item.profiles;
        
        return {
          id: item.id,
          user_id: item.user_id,
          view_started_at: item.view_started_at,
          view_ended_at: item.view_ended_at,
          time_spent_seconds: item.time_spent_seconds,
          completion_percentage: item.completion_percentage,
          last_page_viewed: item.last_page_viewed,
          profiles: profiles && typeof profiles === 'object' && profiles !== null && !('error' in profiles)
            ? profiles as { first_name: string | null; last_name: string | null; email: string | null }
            : null
        };
      });
      
      setViews(typedData);
    } catch (error: any) {
      console.error('Error fetching document analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load document analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAnalytics();
    }
  }, [open, documentId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadAnalyticsCSV = () => {
    if (!views.length) {
      toast({
        title: "No Data",
        description: "No analytics data available to download",
        variant: "destructive"
      });
      return;
    }

    const csvData = views.map(view => ({
      user_name: view.profiles ? `${view.profiles.first_name || ''} ${view.profiles.last_name || ''}`.trim() : 'Unknown',
      user_email: view.profiles?.email || 'Unknown',
      view_started: formatDate(view.view_started_at),
      view_ended: view.view_ended_at ? formatDate(view.view_ended_at) : 'Ongoing',
      time_spent: formatDuration(view.time_spent_seconds),
      completion_percentage: view.completion_percentage || 0,
      last_page_viewed: view.last_page_viewed || 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${documentName.replace(/[^a-z0-9]/gi, '_')}_analytics.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Analytics report downloaded successfully"
    });
  };

  const totalViews = views.length;
  const uniqueViewers = new Set(views.map(v => v.user_id)).size;
  const avgTimeSpent = views.length > 0 
    ? views.reduce((acc, v) => acc + (v.time_spent_seconds || 0), 0) / views.length 
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 px-3">
          <Eye className="h-3 w-3 mr-1" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Analytics - {documentName}</DialogTitle>
          <DialogDescription>
            View detailed analytics for document views and engagement
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-xl font-bold">{totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Viewers</p>
                  <p className="text-xl font-bold">{uniqueViewers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time Spent</p>
                  <p className="text-xl font-bold">{formatDuration(Math.round(avgTimeSpent))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">View History</h3>
          <Button onClick={downloadAnalyticsCSV} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Viewer</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Last Page</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {views.map((view) => (
                <TableRow key={view.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {view.profiles ? `${view.profiles.first_name || ''} ${view.profiles.last_name || ''}`.trim() : 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">{view.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(view.view_started_at)}</TableCell>
                  <TableCell className="text-sm">
                    {view.view_ended_at ? formatDate(view.view_ended_at) : (
                      <Badge variant="secondary">Ongoing</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(view.time_spent_seconds)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${view.completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{view.completion_percentage || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{view.last_page_viewed || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && views.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No views yet</h3>
            <p className="text-gray-500">This document hasn't been viewed by anyone yet.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
