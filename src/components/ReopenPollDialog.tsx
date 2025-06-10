
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, UserX, AlertTriangle } from 'lucide-react';
import { Poll, usePolls } from '@/hooks/usePolls';
import { supabase } from '@/integrations/supabase/client';

interface ReopenPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export const ReopenPollDialog: React.FC<ReopenPollDialogProps> = ({ open, onOpenChange, poll }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { reopenPoll, resetUserVotes, resetAllVotes } = usePolls();

  useEffect(() => {
    if (open && poll) {
      fetchProfiles();
    }
  }, [open, poll]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleReopenPoll = async () => {
    if (!poll) return;
    
    setLoading(true);
    await reopenPoll(poll.id);
    setLoading(false);
    onOpenChange(false);
  };

  const handleResetUserVotes = async () => {
    if (!poll || !selectedUser) return;
    
    setLoading(true);
    await resetUserVotes(poll.id, selectedUser);
    setLoading(false);
    setSelectedUser('');
  };

  const handleResetAllVotes = async () => {
    if (!poll) return;
    
    if (confirm('Are you sure you want to reset ALL votes? This action cannot be undone.')) {
      setLoading(true);
      await resetAllVotes(poll.id);
      setLoading(false);
    }
  };

  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Reopen Poll</span>
          </DialogTitle>
          <DialogDescription>
            Manage poll reopening and vote resets for completed polls
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Poll Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {poll.title}
                <Badge variant="secondary">Completed</Badge>
              </CardTitle>
              {poll.description && (
                <p className="text-sm text-muted-foreground">{poll.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Voters:</span>
                  <span className="ml-2 font-medium">{poll.stats?.total_voters || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Votes Cast:</span>
                  <span className="ml-2 font-medium">{poll.stats?.voted_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reopen Poll */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reopen Poll
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reopen this completed poll to allow voting again. This will change the poll status back to active.
              </p>
              <Button 
                onClick={handleReopenPoll}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading ? 'Reopening...' : 'Reopen Poll'}
              </Button>
            </CardContent>
          </Card>

          {/* Reset Individual User Votes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Reset Individual User Votes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reset votes for a specific user on this poll. The user will be able to vote again.
              </p>
              <div className="space-y-3">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to reset votes" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name || profile.last_name 
                          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                          : profile.email || 'Unknown User'
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleResetUserVotes}
                  disabled={!selectedUser || loading}
                  variant="outline"
                  className="w-full"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reset User Votes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset All Votes */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Users className="h-4 w-4" />
                Reset All Votes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-destructive">
                  This will permanently delete ALL votes for this poll. This action cannot be undone.
                </p>
              </div>
              <Button 
                onClick={handleResetAllVotes}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Reset All Votes
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
