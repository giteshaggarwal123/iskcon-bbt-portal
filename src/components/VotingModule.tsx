import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Vote, Check, Plus, Calendar, Users, FileText, Edit, Trash2, Eye, RefreshCw, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { CreatePollDialog } from './CreatePollDialog';
import { SimpleVotingDialog } from './SimpleVotingDialog';
import { PollResultsDialog } from './PollResultsDialog';
import { EditPollDialog } from './EditPollDialog';
import { ReopenPollDialog } from './ReopenPollDialog';
import { usePolls } from '@/hooks/usePolls';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

export const VotingModule: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollResults, setPollResults] = useState<{[key: string]: any}>({});
  
  const { polls, loading, deletePoll, updatePollStatus, refetch } = usePolls();
  const userRole = useUserRole();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const activePolls = polls.filter(poll => poll.status === 'active');
  const completedPolls = polls.filter(poll => poll.status === 'completed');

  // Fetch results for completed polls
  React.useEffect(() => {
    const fetchCompletedPollResults = async () => {
      const results: {[key: string]: any} = {};
      
      for (const poll of completedPolls) {
        try {
          const { data: votes, error } = await supabase
            .from('poll_votes')
            .select('sub_poll_id, vote')
            .eq('poll_id', poll.id);

          if (error) throw error;

          const subPollResults: {[key: string]: any} = {};
          
          // Initialize each sub-poll with zero counts
          poll.sub_polls?.forEach(subPoll => {
            subPollResults[subPoll.id] = {
              favor: 0,
              against: 0,
              abstain: 0,
              total: 0
            };
          });

          // Count votes for each sub-poll
          votes?.forEach(vote => {
            if (subPollResults[vote.sub_poll_id]) {
              if (vote.vote === 'favor') {
                subPollResults[vote.sub_poll_id].favor++;
              } else if (vote.vote === 'against') {
                subPollResults[vote.sub_poll_id].against++;
              } else if (vote.vote === 'abstain') {
                subPollResults[vote.sub_poll_id].abstain++;
              }
              subPollResults[vote.sub_poll_id].total++;
            }
          });

          results[poll.id] = subPollResults;
        } catch (error) {
          console.error('Error fetching poll results:', error);
        }
      }
      
      setPollResults(results);
    };

    if (completedPolls.length > 0) {
      fetchCompletedPollResults();
    }
  }, [completedPolls]);

  const getOverallPollResult = (poll: any) => {
    const results = pollResults[poll.id];
    if (!results || !poll.sub_polls) return null;

    let totalFavor = 0;
    let totalAgainst = 0;
    let totalAbstain = 0;
    let totalVotes = 0;

    // Sum up all votes across all sub-polls
    Object.values(results).forEach((result: any) => {
      totalFavor += result.favor;
      totalAgainst += result.against;
      totalAbstain += result.abstain;
      totalVotes += result.total;
    });

    if (totalVotes === 0) return null;

    const max = Math.max(totalFavor, totalAgainst, totalAbstain);
    if (totalFavor === max && totalFavor > 0) return 'favor';
    if (totalAgainst === max && totalAgainst > 0) return 'against';
    if (totalAbstain === max && totalAbstain > 0) return 'abstain';
    return null;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    switch (result) {
      case 'favor':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'against':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'abstain':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><MinusCircle className="h-3 w-3 mr-1" />Abstained</Badge>;
      default:
        return null;
    }
  };

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

  const handleReopenPoll = (poll: any) => {
    if (!userRole.canEditVoting) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to reopen polls",
        variant: "destructive"
      });
      return;
    }
    setSelectedPoll(poll);
    setShowReopenDialog(true);
  };

  const handleDeletePoll = async (pollId: string, pollStatus?: string) => {
    if (!userRole.canDeleteContent) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete polls",
        variant: "destructive"
      });
      return;
    }
    
    const isCompleted = pollStatus === 'completed';
    const confirmMessage = isCompleted 
      ? 'Are you sure you want to delete this completed poll? This will permanently remove the poll and all its voting results. This action cannot be undone.'
      : 'Are you sure you want to delete this poll?';
    
    if (confirm(confirmMessage)) {
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

  // Defensive helpers
  const safe = (val: any, fallback: string = '') => (val === undefined || val === null ? fallback : val);

  // When the create dialog closes, if it was just open, refetch polls
  const handleCreateDialogChange = (open: boolean) => {
    if (!open) {
      refetch();
    }
    setShowCreateDialog(open);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const noPolls = polls.length === 0;
  return (
    <div className="max-w-5xl mx-auto px-0 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Voting & Polls</h1>
          <p className="text-sm text-muted-foreground">Participate in decisions and view results.</p>
          <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mt-2 inline-block">All voting is anonymous. Individual choices are hidden from other members.</p>
        </div>
        {userRole.canCreateVoting && !userRole.loading && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#8E1616] hover:bg-[#7A1414] text-white">
            <Plus className="h-4 w-4 mr-2" /> Create Poll
          </Button>
        )}
      </div>

      {/* Content Section */}
      {noPolls ? (
        <div className="text-center text-muted-foreground py-12">
          <div className="max-w-md mx-auto">
            <Vote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No polls available</h3>
            <p className="text-sm text-gray-500">Polls will appear here when they are created by administrators.</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active ({activePolls.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedPolls.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activePolls.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="max-w-md mx-auto">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active polls</h3>
                  <p className="text-sm text-gray-500">All polls have been completed or are not yet available.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 mb-2">
                            <span className="font-semibold">{safe(poll.title, 'Untitled')}</span>
                            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                          </CardTitle>
                          {poll.description && (
                            <CardDescription className="text-sm text-gray-600 mt-1">
                              {safe(poll.description, '')}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Deadline: {poll.deadline ? format(new Date(poll.deadline), 'MMM dd, yyyy') : 'No deadline'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0} voted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>{poll.stats?.sub_poll_count || 0} questions</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {!poll.hasVoted ? (
                          <Button onClick={() => handleVoteNow(poll)} className="bg-green-600 hover:bg-green-700 text-white">
                            <Vote className="h-4 w-4 mr-2" />Vote Now
                          </Button>
                        ) : (
                          <Button disabled className="bg-gray-300 text-gray-600 cursor-not-allowed">
                            <Check className="h-4 w-4 mr-2" />Voted
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => handleViewResults(poll)}>
                          <Eye className="h-4 w-4 mr-2" />View Results
                        </Button>
                        {userRole.canEditVoting && (
                          <Button variant="outline" onClick={() => handleEditPoll(poll)}>
                            <Edit className="h-4 w-4 mr-2" />Edit
                          </Button>
                        )}
                        {userRole.canEditVoting && (
                          <Button variant="outline" onClick={() => handleCompletePoll(poll.id)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            <Check className="h-4 w-4 mr-2" />Complete
                          </Button>
                        )}
                        {userRole.canDeleteContent && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleDeletePoll(poll.id, poll.status)} 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                            title="Delete poll"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedPolls.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="max-w-md mx-auto">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed polls</h3>
                  <p className="text-sm text-gray-500">Completed polls will appear here once voting has finished.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedPolls.map((poll) => {
                  const overallResult = getOverallPollResult(poll);
                  const resultBadge = getResultBadge(overallResult);
                  return (
                    <Card key={poll.id} className="hover:shadow-md transition-shadow border-l-4 border-l-gray-400">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 mb-2">
                              <span className="font-semibold">{safe(poll.title, 'Untitled')}</span>
                              <Badge variant="secondary" className="text-xs">Completed</Badge>
                              {resultBadge}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-600 mt-1">
                              Completed on {poll.deadline ? format(new Date(poll.deadline), 'MMM dd, yyyy') : 'Unknown date'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button variant="outline" onClick={() => handleViewResults(poll)}>
                            <Eye className="h-4 w-4 mr-2" />View Results
                          </Button>
                          {userRole.canEditVoting && (
                            <Button variant="outline" onClick={() => handleReopenPoll(poll)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <RefreshCw className="h-4 w-4 mr-2" />Reopen
                            </Button>
                          )}
                          {userRole.canDeleteContent && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleDeletePoll(poll.id, poll.status)} 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                              title={poll.status === 'completed' ? 'Delete completed poll (this will permanently remove all voting results)' : 'Delete poll'}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {poll.status === 'completed' ? 'Delete Poll' : 'Delete'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Dialogs */}
      {userRole.canCreateVoting && (
        <CreatePollDialog open={showCreateDialog} onOpenChange={handleCreateDialogChange} />
      )}
      <SimpleVotingDialog open={showVotingDialog} onOpenChange={setShowVotingDialog} poll={selectedPoll} />
      <PollResultsDialog open={showResultsDialog} onOpenChange={setShowResultsDialog} poll={selectedPoll} />
      <EditPollDialog open={showEditDialog} onOpenChange={setShowEditDialog} poll={selectedPoll} />
      <ReopenPollDialog open={showReopenDialog} onOpenChange={setShowReopenDialog} poll={selectedPoll} />

      {/* Floating Action Button for Creating Polls */}
      {userRole.canCreateVoting && (
        <Button 
          onClick={() => setShowCreateDialog(true)} 
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg bg-[#8E1616] hover:bg-[#7A1414] text-white w-16 h-16 flex items-center justify-center text-3xl"
        >
          <Plus className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
};
