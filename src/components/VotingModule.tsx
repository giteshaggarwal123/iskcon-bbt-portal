
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Vote, Clock, Users, CheckCircle, XCircle, MinusCircle, Plus, BarChart3, Download, Eye, Edit, Trash2, RotateCcw } from 'lucide-react';
import { VotingDialog } from './VotingDialog';
import { CreatePollDialog } from './CreatePollDialog';
import { EditPollDialog } from './EditPollDialog';
import { useUserRole } from '@/hooks/useUserRole';
import { usePolls, Poll } from '@/hooks/usePolls';
import { format } from 'date-fns';

export const VotingModule: React.FC = () => {
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const userRole = useUserRole();
  const { polls, loading, deletePoll, updatePollStatus, downloadAttachment } = usePolls();

  const canCreatePolls = userRole.isSuperAdmin || userRole.isAdmin;
  const canManagePolls = userRole.isSuperAdmin || userRole.isAdmin;

  const handleVoteClick = (poll: Poll) => {
    console.log('Opening voting dialog for poll:', poll.id);
    setSelectedPoll(poll);
    setShowVotingDialog(true);
  };

  const handleEditPoll = (poll: Poll) => {
    console.log('Opening edit dialog for poll:', poll.id);
    setSelectedPoll(poll);
    setShowEditDialog(true);
  };

  const handleDeletePoll = async (poll: Poll) => {
    if (confirm(`Are you sure you want to delete the poll "${poll.title}"?`)) {
      await deletePoll(poll.id);
    }
  };

  const handleReopenPoll = async (poll: Poll) => {
    if (confirm(`Are you sure you want to reopen the poll "${poll.title}"?`)) {
      await updatePollStatus(poll.id, 'active');
    }
  };

  const handleViewAttachment = (attachmentPath: string) => {
    window.open(`https://daiimiznlkffbbadhodw.supabase.co/storage/v1/object/public/poll-attachments/${attachmentPath}`, '_blank');
  };

  const handleDownloadAttachment = (attachmentPath: string, fileName: string) => {
    downloadAttachment(attachmentPath, fileName);
  };

  const getProgressPercentage = (poll: Poll) => {
    if (!poll.stats) return 0;
    return poll.stats.total_voters > 0 ? (poll.stats.voted_count / poll.stats.total_voters) * 100 : 0;
  };

  const activePolls = polls.filter(poll => poll.status === 'active');
  const completedPolls = polls.filter(poll => poll.status === 'completed');

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading polls...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-0 flex flex-col">
      {/* Header Section - Mobile Optimized */}
      <div className="w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 truncate">
              Voting System
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage polls, ballots, and voting processes
            </p>
          </div>
          {canCreatePolls && (
            <div className="flex-shrink-0">
              <Button 
                className="w-full sm:w-auto h-10 sm:h-auto"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Create Poll</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section - Mobile Optimized */}
      <div className="w-full flex-1 min-h-0">
        <Tabs defaultValue="active" className="w-full h-full flex flex-col">
          <div className="w-full mb-6">
            <TabsList className="w-full grid grid-cols-3 h-10">
              <TabsTrigger value="active" className="text-xs sm:text-sm truncate">
                Active ({activePolls.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm truncate">
                Completed ({completedPolls.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm truncate">
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Active Polls Tab */}
          <TabsContent value="active" className="w-full flex-1 min-h-0 mt-0">
            {activePolls.length === 0 ? (
              <Card className="w-full">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Active Polls</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There are currently no active polls to vote on.
                  </p>
                  {canCreatePolls && (
                    <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="w-full space-y-4 sm:space-y-6">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="w-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-xl mb-2 leading-tight">
                            {poll.title}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed mb-3">
                            {poll.description}
                          </CardDescription>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {poll.sub_polls?.length || 0} question{(poll.sub_polls?.length || 0) !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">Anonymous Voting</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className="bg-green-600 text-white text-xs">
                            {poll.status}
                          </Badge>
                          {canManagePolls && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPoll(poll)}
                                className="h-8 w-8"
                                title="Edit poll"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePoll(poll)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete poll"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Poll Info Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0} voted
                              </span>
                            </div>
                            <div className="text-destructive whitespace-nowrap">
                              {poll.stats?.pending_count || 0} pending
                            </div>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Participation</span>
                            <span className="font-medium">{Math.round(getProgressPercentage(poll))}%</span>
                          </div>
                          <Progress value={getProgressPercentage(poll)} className="h-2" />
                        </div>

                        {/* Attachments Section */}
                        {poll.attachments && poll.attachments.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3 text-sm">Supporting Document</h4>
                            <div className="space-y-3">
                              {poll.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-blue-800 truncate">
                                      {attachment.file_name}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      {attachment.file_size ? (attachment.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewAttachment(attachment.file_path)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Questions Section */}
                        {poll.sub_polls && poll.sub_polls.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-3 text-sm">Questions in this poll:</h4>
                            <div className="space-y-2">
                              {poll.sub_polls.map((subPoll, index) => (
                                <div key={subPoll.id} className="text-sm leading-relaxed">
                                  <span className="font-medium">{index + 1}.</span> {subPoll.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 border-t">
                          <Button 
                            className="w-full sm:w-auto"
                            onClick={() => handleVoteClick(poll)}
                          >
                            <Vote className="h-4 w-4 mr-2" />
                            Vote on All Questions
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Polls Tab */}
          <TabsContent value="completed" className="w-full flex-1 min-h-0 mt-0">
            {completedPolls.length === 0 ? (
              <Card className="w-full">
                <CardContent className="p-6 sm:p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Completed Polls</h3>
                  <p className="text-sm text-muted-foreground">No polls have been completed yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full space-y-4 sm:space-y-6">
                {completedPolls.map((poll) => (
                  <Card key={poll.id} className="w-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-xl mb-2 leading-tight">
                            {poll.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {poll.sub_polls?.length || 0} question{(poll.sub_polls?.length || 0) !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">Anonymous Voting</Badge>
                          </div>
                          <CardDescription className="text-sm">
                            Completed on {format(new Date(poll.updated_at), 'PPP')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className="bg-green-600 text-white text-xs">Completed</Badge>
                          {canManagePolls && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReopenPoll(poll)}
                                className="h-8 w-8"
                                title="Reopen poll"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPoll(poll)}
                                className="h-8 w-8"
                                title="Edit poll"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePoll(poll)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete poll"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>Turnout: {Math.round(getProgressPercentage(poll))}%</span>
                          <span>{poll.stats?.total_voters || 0} total voters</span>
                        </div>

                        {poll.attachments && poll.attachments.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3 text-sm">Supporting Document</h4>
                            <div className="space-y-3">
                              {poll.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-blue-800 truncate">
                                      {attachment.file_name}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      {attachment.file_size ? (attachment.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewAttachment(attachment.file_path)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="w-full flex-1 min-h-0 mt-0">
            <div className="w-full space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Vote className="h-6 sm:h-8 w-6 sm:w-8 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xl sm:text-2xl font-bold truncate">{activePolls.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Active Polls</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xl sm:text-2xl font-bold truncate">
                          {polls.reduce((sum, poll) => sum + (poll.stats?.voted_count || 0), 0)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Votes Cast</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xl sm:text-2xl font-bold truncate">
                          {polls.reduce((sum, poll) => sum + (poll.stats?.pending_count || 0), 0)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Pending Votes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xl sm:text-2xl font-bold truncate">
                          {polls.length > 0 ? Math.round(
                            polls.reduce((sum, poll) => sum + getProgressPercentage(poll), 0) / polls.length
                          ) : 0}%
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Avg Participation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Ongoing Vote Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activePolls.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4 text-sm">No active polls</p>
                      ) : (
                        activePolls.map((poll) => (
                          <div key={poll.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{poll.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-medium">
                                {poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0}
                              </p>
                              <p className="text-xs text-destructive">
                                {poll.stats?.pending_count || 0} pending
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Voting Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Average participation rate</span>
                        <span className="font-medium">
                          {polls.length > 0 ? Math.round(
                            polls.reduce((sum, poll) => sum + getProgressPercentage(poll), 0) / polls.length
                          ) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total polls</span>
                        <span className="font-medium">{polls.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Completed polls</span>
                        <span className="font-medium">{completedPolls.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Active polls</span>
                        <span className="font-medium">{activePolls.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <VotingDialog 
        open={showVotingDialog} 
        onOpenChange={setShowVotingDialog}
        poll={selectedPoll}
      />
      <CreatePollDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
      <EditPollDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        poll={selectedPoll}
      />
    </div>
  );
};
