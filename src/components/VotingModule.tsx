
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Vote, Clock, Users, CheckCircle, XCircle, MinusCircle, Plus, BarChart3, Download, Eye, Edit, Trash2, RotateCcw } from 'lucide-react';
import { VotingDialog } from './VotingDialog';
import { CreatePollDialog } from './CreatePollDialog';
import { useUserRole } from '@/hooks/useUserRole';

export const VotingModule: React.FC = () => {
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const userRole = useUserRole();

  // Only super admin and admin can create polls
  const canCreatePolls = userRole.isSuperAdmin || userRole.isAdmin;
  const canManagePolls = userRole.isSuperAdmin || userRole.isAdmin;

  const handleVoteClick = (poll: any) => {
    setSelectedPoll(poll);
    setShowVotingDialog(true);
  };

  const handleEditPoll = (poll: any) => {
    console.log('Edit poll:', poll.id);
    // TODO: Implement edit poll functionality
  };

  const handleDeletePoll = (poll: any) => {
    console.log('Delete poll:', poll.id);
    // TODO: Implement delete poll functionality
  };

  const handleReopenPoll = (poll: any) => {
    console.log('Reopen poll:', poll.id);
    // TODO: Implement reopen poll functionality
  };

  const handleViewAttachment = (attachmentUrl: string) => {
    window.open(attachmentUrl, '_blank');
  };

  const handleDownloadAttachment = (attachmentUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activePolls = [
    {
      id: 1,
      title: 'Temple Expansion Project Decisions',
      description: 'Multiple decisions required for the temple expansion project',
      deadline: '2024-01-25 5:00 PM',
      totalVoters: 12,
      votedCount: 8,
      notVotedCount: 4,
      status: 'active',
      questionCount: 3,
      attachment: {
        name: 'Temple_Expansion_Budget.pdf',
        url: '/sample-document.pdf',
        size: '2.5 MB'
      },
      subPolls: [
        { id: '1', title: 'Approve budget increase', description: 'Increase temple expansion budget by ₹20 lakhs' },
        { id: '2', title: 'Approve timeline extension', description: 'Extend project completion deadline by 3 months' },
        { id: '3', title: 'Approve contractor selection', description: 'Select the recommended contractor for the project' }
      ]
    },
    {
      id: 2,
      title: 'Festival Committee Formation',
      description: 'Decisions about new festival planning committee',
      deadline: '2024-01-30 12:00 PM',
      totalVoters: 12,
      votedCount: 5,
      notVotedCount: 7,
      status: 'active',
      questionCount: 2,
      attachment: {
        name: 'Festival_Committee_Proposal.docx',
        url: '/sample-document.docx',
        size: '1.2 MB'
      },
      subPolls: [
        { id: '1', title: 'Create festival committee', description: 'Form a dedicated festival planning committee' },
        { id: '2', title: 'Assign committee budget', description: 'Allocate ₹5 lakhs annual budget for festival activities' }
      ]
    }
  ];

  const completedPolls = [
    {
      id: 3,
      title: 'Policy Update: Prasadam Distribution',
      completedDate: '2024-01-18',
      totalVoters: 12,
      votedCount: 12,
      notVotedCount: 0,
      votes: { favor: 10, against: 1, abstain: 1 },
      result: 'Approved',
      turnout: 100,
      questionCount: 1,
      attachment: {
        name: 'Prasadam_Policy_Draft.pdf',
        url: '/sample-document.pdf',
        size: '800 KB'
      }
    }
  ];

  const getProgressPercentage = (poll: any) => {
    return (poll.votedCount / poll.totalVoters) * 100;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voting System</h1>
            <p className="text-gray-600">Manage polls, ballots, and voting processes</p>
          </div>
          {canCreatePolls && (
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          )}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6">
              {activePolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">{poll.questionCount} question{poll.questionCount !== 1 ? 's' : ''}</Badge>
                          <Badge variant="secondary">Anonymous Voting</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-success text-white">{poll.status}</Badge>
                        {canManagePolls && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPoll(poll)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePoll(poll)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Deadline: {poll.deadline}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{poll.votedCount}/{poll.totalVoters} voted</span>
                          </div>
                          <div className="text-red-600">
                            <span>{poll.notVotedCount} pending</span>
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

                      {poll.attachment && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Supporting Document</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">{poll.attachment.name}</p>
                              <p className="text-xs text-blue-600">{poll.attachment.size}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttachment(poll.attachment.url)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadAttachment(poll.attachment.url, poll.attachment.name)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Questions in this poll:</h4>
                        <div className="space-y-2">
                          {poll.subPolls?.map((subPoll: any, index: number) => (
                            <div key={subPoll.id} className="text-sm">
                              <span className="font-medium">{index + 1}.</span> {subPoll.title}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4 border-t">
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
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
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedPolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">{poll.questionCount} question{poll.questionCount !== 1 ? 's' : ''}</Badge>
                          <Badge variant="secondary">Anonymous Voting</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={poll.result === 'Approved' ? 'bg-success text-white' : 'bg-error text-white'}>
                          {poll.result}
                        </Badge>
                        {canManagePolls && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReopenPoll(poll)}
                              className="h-8 w-8"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPoll(poll)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePoll(poll)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardDescription>Completed on {poll.completedDate}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Turnout: {poll.turnout}%</span>
                        <span>{poll.totalVoters} total voters</span>
                      </div>

                      {poll.attachment && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Supporting Document</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">{poll.attachment.name}</p>
                              <p className="text-xs text-blue-600">{poll.attachment.size}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttachment(poll.attachment.url)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadAttachment(poll.attachment.url, poll.attachment.name)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Vote className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">2</div>
                      <div className="text-sm text-gray-500">Active Polls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">13</div>
                      <div className="text-sm text-gray-500">Total Voted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">11</div>
                      <div className="text-sm text-gray-500">Pending Votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-success" />
                    <div>
                      <div className="text-2xl font-bold">54%</div>
                      <div className="text-sm text-gray-500">Avg Participation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ongoing Vote Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activePolls.map((poll) => (
                      <div key={poll.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{poll.title}</p>
                          <p className="text-sm text-gray-500">Deadline: {poll.deadline}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{poll.votedCount}/{poll.totalVoters}</p>
                          <p className="text-xs text-red-600">{poll.notVotedCount} pending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Voting Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average participation rate</span>
                      <span className="font-medium">54%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total polls this month</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed polls</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Most active voters</span>
                      <span className="font-medium">8 members</span>
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
    </>
  );
};
