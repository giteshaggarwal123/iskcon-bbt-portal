import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Vote, Check, Plus, Calendar, Users, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { CreatePollDialog } from './CreatePollDialog';
import { VotingDialog } from './VotingDialog';
import { PollResultsDialog } from './PollResultsDialog';
import { EditPollDialog } from './EditPollDialog';
import { usePolls } from '@/hooks/usePolls';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const VotingModule: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  
  const { polls, loading, deletePoll, updatePollStatus } = usePolls();
  const userRole = useUserRole();
  const { toast } = useToast();

  const activePolls = polls.filter(poll => poll.status === 'active');
  const completedPolls = polls.filter(poll => poll.status === 'completed');
  const draftPolls: any[] = [];

  const handleVoteNow = (poll: any) => {
    setSelectedPoll(poll);
    setShowVotingDialog(true);
  };

  const handleViewResults = (poll: any) => {
    setSelectedPoll(poll);
    setShowResultsDialog(true);
  };

  const handleEditPoll = (poll: any) => {
    if (!userRole.canEditVoting) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit polls",
        variant: "destructive"
      });
      return;
    }
    setSelectedPoll(poll);
    setShowEditDialog(true);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!userRole.canDeleteContent) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete polls",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm('Are you sure you want to delete this poll?')) {
      await deletePoll(pollId);
    }
  };

  const handleCompletePoll = async (pollId: string) => {
    if (!userRole.canEditVoting) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage polls",
        variant: "destructive"
      });
      return;
    }
    await updatePollStatus(pollId, 'completed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voting & Polls</h1>
            <p className="text-gray-600 mt-1">Participate in bureau decisions and view voting results</p>
          </div>
          {userRole.canCreateVoting && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          )}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Polls ({activePolls.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedPolls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activePolls.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active polls available</p>
                  {userRole.canVoteOnly && (
                    <p className="text-sm text-gray-500 mt-2">Check back later for new voting opportunities</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {poll.title}
                            <Badge className="bg-green-500 text-white">Active</Badge>
                            {poll.is_secret && (
                              <Badge variant="outline">Secret Ballot</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {poll.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0} voted
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {poll.stats?.sub_poll_count || 0} questions
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleVoteNow(poll)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Vote className="h-4 w-4 mr-2" />
                          Vote Now
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewResults(poll)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        
                        {userRole.canEditVoting && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => handleEditPoll(poll)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              onClick={() => handleCompletePoll(poll.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              onClick={() => handleDeletePoll(poll.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedPolls.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed polls</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedPolls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {poll.title}
                            <Badge variant="secondary">Completed</Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            Completed on {format(new Date(poll.deadline), 'MMM dd, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewResults(poll)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {userRole.canCreateVoting && (
        <CreatePollDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      )}
      
      <VotingDialog 
        open={showVotingDialog} 
        onOpenChange={setShowVotingDialog}
        poll={selectedPoll}
      />
      
      <PollResultsDialog 
        open={showResultsDialog} 
        onOpenChange={setShowResultsDialog}
        poll={selectedPoll}
      />
      
      {userRole.canEditVoting && (
        <EditPollDialog 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
          poll={selectedPoll}
        />
      )}
    </div>
  );
};
