
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voting System</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage polls, ballots, and voting processes</p>
          </div>
          {canCreatePolls && (
            <Button 
              className="bg-primary hover:bg-primary/90 w-full md:w-auto"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          )}
        </div>

        <Tabs defaultValue="active" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="active" className="text-xs md:text-sm px-2 py-2">
              Active ({activePolls.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm px-2 py-2">
              Completed ({completedPolls.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 py-2">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 md:space-y-6">
            {activePolls.length === 0 ? (
              <Card>
                <CardContent className="p-6 md:p-8 text-center">
                  <Vote className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Active Polls</h3>
                  <p className="text-gray-500 mb-4 text-sm md:text-base">There are currently no active polls to vote on.</p>
                  {canCreatePolls && (
                    <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 md:pb-4">
                      <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-start md:space-y-0">
                        <div className="flex-1">
                          <CardTitle className="text-lg md:text-xl leading-tight">{poll.title}</CardTitle>
                          <CardDescription className="mt-2 text-sm">{poll.description}</CardDescription>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {poll.sub_polls?.length || 0} question{(poll.sub_polls?.length || 0) !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">Anonymous Voting</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-start">
                          <Badge className="bg-success text-white text-xs">{poll.status}</Badge>
                          {canManagePolls && (
                            <div className="flex space-x-1">
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
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                title="Delete poll"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm">Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs md:text-sm">{poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0} voted</span>
                          </div>
                          <div className="text-red-600 text-xs md:text-sm">
                            <span>{poll.stats?.pending_count || 0} pending</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Participation</span>
                          <span>{Math.round(getProgressPercentage(poll))}%</span>
                        </div>
                        <Progress value={getProgressPercentage(poll)} className="h-2" />
                      </div>

                      {poll.attachments && poll.attachments.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                          <h4 className="font-medium text-blue-900 mb-2 text-sm md:text-base">Supporting Document</h4>
                          {poll.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800 break-all">{attachment.file_name}</p>
                                <p className="text-xs text-blue-600">
                                  {attachment.file_size ? (attachment.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                </p>
                              </div>
                              <div className="flex space-x-2 w-full md:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewAttachment(attachment.file_path)}
                                  className="flex-1 md:flex-none text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                                  className="flex-1 md:flex-none text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {poll.sub_polls && poll.sub_polls.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                          <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">Questions in this poll:</h4>
                          <div className="space-y-2">
                            {poll.sub_polls.map((subPoll, index) => (
                              <div key={subPoll.id} className="text-xs md:text-sm">
                                <span className="font-medium">{index + 1}.</span> {subPoll.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white w-full md:w-auto"
                          onClick={() => handleVoteClick(poll)}
                        >
                          <Vote className="h-4 w-4 mr-2" />
                          Vote on All Questions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 md:space-y-6">
            {completedPolls.length === 0 ? (
              <Card>
                <CardContent className="p-6 md:p-8 text-center">
                  <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Completed Polls</h3>
                  <p className="text-gray-500 text-sm md:text-base">No polls have been completed yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {completedPolls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 md:pb-4">
                      <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-start md:space-y-0">
                        <div className="flex-1">
                          <CardTitle className="text-lg md:text-xl leading-tight">{poll.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {poll.sub_polls?.length || 0} question{(poll.sub_polls?.length || 0) !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">Anonymous Voting</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-start">
                          <Badge className="bg-success text-white text-xs">Completed</Badge>
                          {canManagePolls && (
                            <div className="flex space-x-1">
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
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                title="Delete poll"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        Completed on {format(new Date(poll.updated_at), 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-xs md:text-sm text-gray-500">
                        <span>Turnout: {Math.round(getProgressPercentage(poll))}%</span>
                        <span>{poll.stats?.total_voters || 0} total voters</span>
                      </div>

                      {poll.attachments && poll.attachments.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                          <h4 className="font-medium text-blue-900 mb-2 text-sm md:text-base">Supporting Document</h4>
                          {poll.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800 break-all">{attachment.file_name}</p>
                                <p className="text-xs text-blue-600">
                                  {attachment.file_size ? (attachment.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                </p>
                              </div>
                              <div className="flex space-x-2 w-full md:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewAttachment(attachment.file_path)}
                                  className="flex-1 md:flex-none text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                                  className="flex-1 md:flex-none text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center space-x-2">
                    <Vote className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-lg md:text-2xl font-bold truncate">{activePolls.length}</div>
                      <div className="text-xs md:text-sm text-gray-500">Active Polls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-lg md:text-2xl font-bold truncate">
                        {polls.reduce((sum, poll) => sum + (poll.stats?.voted_count || 0), 0)}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">Total Votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-lg md:text-2xl font-bold truncate">
                        {polls.reduce((sum, poll) => sum + (poll.stats?.pending_count || 0), 0)}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-success flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-lg md:text-2xl font-bold truncate">
                        {polls.length > 0 ? Math.round(
                          polls.reduce((sum, poll) => sum + getProgressPercentage(poll), 0) / polls.length
                        ) : 0}%
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">Avg Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Ongoing Vote Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {activePolls.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-sm">No active polls</p>
                    ) : (
                      activePolls.map((poll) => (
                        <div key={poll.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 bg-gray-50 rounded-lg space-y-2 md:space-y-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{poll.title}</p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              Deadline: {format(new Date(poll.deadline), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs md:text-sm font-medium">
                              {poll.stats?.voted_count || 0}/{poll.stats?.total_voters || 0}
                            </p>
                            <p className="text-xs text-red-600">
                              {poll.stats?.pending_count || 0} pending
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Recent Voting Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Average participation rate</span>
                      <span className="font-medium">
                        {polls.length > 0 ? Math.round(
                          polls.reduce((sum, poll) => sum + getProgressPercentage(poll), 0) / polls.length
                        ) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Total polls</span>
                      <span className="font-medium">{polls.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Completed polls</span>
                      <span className="font-medium">{completedPolls.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Active polls</span>
                      <span className="font-medium">{activePolls.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    </>
  );
};
