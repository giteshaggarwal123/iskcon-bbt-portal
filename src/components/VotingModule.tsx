
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Vote, Clock, Users, CheckCircle, XCircle, MinusCircle, Plus, BarChart3 } from 'lucide-react';
import { VotingDialog } from './VotingDialog';
import { CreatePollDialog } from './CreatePollDialog';

export const VotingModule: React.FC = () => {
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);

  const handleVoteClick = (poll: any) => {
    setSelectedPoll(poll);
    setShowVotingDialog(true);
  };

  const activePolls = [
    {
      id: 1,
      title: 'Temple Expansion Project Decisions',
      description: 'Multiple decisions required for the temple expansion project',
      deadline: '2024-01-25 5:00 PM',
      totalVoters: 12,
      votedCount: 8,
      status: 'active',
      isSecret: true,
      questionCount: 3,
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
      status: 'active',
      isSecret: false,
      questionCount: 2,
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
      votes: { favor: 10, against: 1, abstain: 1 },
      result: 'Approved',
      turnout: 100,
      questionCount: 1
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
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                          {poll.isSecret && <Badge variant="secondary">Secret Ballot</Badge>}
                        </div>
                      </div>
                      <Badge className="bg-success text-white">{poll.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Deadline: {poll.deadline}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{poll.votedCount}/{poll.totalVoters} voted</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Participation</span>
                          <span>{Math.round(getProgressPercentage(poll))}%</span>
                        </div>
                        <Progress value={getProgressPercentage(poll)} className="h-2" />
                      </div>

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
                        </div>
                      </div>
                      <Badge className={poll.result === 'Approved' ? 'bg-success text-white' : 'bg-error text-white'}>
                        {poll.result}
                      </Badge>
                    </div>
                    <CardDescription>Completed on {poll.completedDate}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Turnout: {poll.turnout}%</span>
                      <span>{poll.totalVoters} total voters</span>
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
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-sm text-gray-500">Total Polls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-success" />
                    <div>
                      <div className="text-2xl font-bold">87%</div>
                      <div className="text-sm text-gray-500">Avg Participation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-warning" />
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-gray-500">Approved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-8 w-8 text-error" />
                    <div>
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-sm text-gray-500">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Configuration</CardTitle>
                <CardDescription>Configure voting rules and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Default Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Default voting duration</span>
                      <span className="text-gray-500">7 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Minimum quorum</span>
                      <span className="text-gray-500">75%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Secret ballot by default</span>
                      <span className="text-gray-500">Yes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Multi-question polls allowed</span>
                      <span className="text-gray-500">Yes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
