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
  
  const { polls, loading, deletePoll, updatePollStatus } = usePolls();
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
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>Voting & Polls</h1>
            <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : ''}`}>Participate in bureau decisions and view voting results</p>
          </div>
          {userRole.canCreateVoting && !userRole.loading && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
              size={isMobile ? "default" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          )}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-auto' : ''}`}>
            <TabsTrigger 
              value="active" 
              className={`${isMobile ? 'text-xs px-2 py-3 flex-1' : ''} whitespace-nowrap`}
            >
              {isMobile ? `Active (${activePolls.length})` : `Active Polls (${activePolls.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className={`${isMobile ? 'text-xs px-2 py-3 flex-1' : ''} whitespace-nowrap`}
            >
              {isMobile ? `Completed (${completedPolls.length})` : `Completed (${completedPolls.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activePolls.length === 0 ? (
              <Card>
                <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
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
                    <CardHeader className={isMobile ? 'p-4 pb-3' : ''}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                            <span className={isMobile ? 'w-full mb-2' : ''}>{poll.title}</span>
                            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                              <Badge className="bg-green-500 text-white">Active</Badge>
                              {poll.is_secret && (
                                <Badge variant="outline">Secret Ballot</Badge>
                              )}
                            </div>
                          </CardTitle>
                          <CardDescription className={`mt-2 ${isMobile ? 'text-sm' : ''}`}>
                            {poll.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : ''}`}>
                      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                            Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0} voted
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {poll.stats?.sub_poll_count || 0} questions
                          </span>
                        </div>
                      </div>
                      
                      {isMobile && <div className="border-t pt-4" />}
                      
                      <div className={`space-y-4 ${isMobile ? '' : ''}`}>
                        {/* Primary Action Buttons */}
                        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-wrap gap-2'}`}>
                          <Button 
                            onClick={() => handleVoteNow(poll)}
                            className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'w-full text-base py-3' : ''}`}
                            size={isMobile ? "default" : "default"}
                          >
                            <Vote className="h-4 w-4 mr-2" />
                            Vote Now
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewResults(poll)}
                            className={isMobile ? 'w-full text-base py-3' : ''}
                            size={isMobile ? "default" : "default"}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                        
                        {/* Admin Action Buttons */}
                        {userRole.canEditVoting && (
                          <>
                            {isMobile && <div className="border-t pt-4" />}
                            <div className={`space-y-3 ${isMobile ? '' : 'flex flex-wrap gap-2'}`}>
                              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-wrap gap-2'}`}>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleEditPoll(poll)}
                                  className={isMobile ? 'w-full text-base py-3' : ''}
                                  size={isMobile ? "default" : "default"}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleCompletePoll(poll.id)}
                                  className={`text-orange-600 hover:text-orange-700 hover:bg-orange-50 ${isMobile ? 'w-full text-base py-3' : ''}`}
                                  size={isMobile ? "default" : "default"}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Complete Vote
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleDeletePoll(poll.id)}
                                  className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isMobile ? 'w-full text-base py-3' : ''}`}
                                  size={isMobile ? "default" : "default"}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
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
                <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
                  <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed polls</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedPolls.map((poll) => {
                  const overallResult = getOverallPollResult(poll);
                  const resultBadge = getResultBadge(overallResult);
                  
                  return (
                    <Card key={poll.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className={isMobile ? 'p-4 pb-3' : ''}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                              <span className={isMobile ? 'w-full mb-2' : ''}>{poll.title}</span>
                              <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                                <Badge variant="secondary">Completed</Badge>
                                {resultBadge}
                              </div>
                            </CardTitle>
                            <CardDescription className={`mt-2 ${isMobile ? 'text-sm' : ''}`}>
                              Completed on {format(new Date(poll.deadline), 'MMM dd, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
                        {isMobile && <div className="border-t pt-4" />}
                        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-wrap gap-2'}`}>
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewResults(poll)}
                            className={isMobile ? 'w-full text-base py-3' : ''}
                            size={isMobile ? "default" : "default"}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                          
                          {userRole.canEditVoting && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleReopenPoll(poll)}
                              className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${isMobile ? 'w-full text-base py-3' : ''}`}
                              size={isMobile ? "default" : "default"}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reopen Poll
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
      </div>

      {/* Dialogs */}
      {userRole.canCreateVoting && (
        <CreatePollDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      )}
      
      <SimpleVotingDialog 
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
        <>
          <EditPollDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog}
            poll={selectedPoll}
          />
          
          <ReopenPollDialog 
            open={showReopenDialog} 
            onOpenChange={setShowReopenDialog}
            poll={selectedPoll}
          />
        </>
      )}
    </div>
  );
};
