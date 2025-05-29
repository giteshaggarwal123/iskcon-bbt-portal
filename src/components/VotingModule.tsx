import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Vote, Clock, Users, CheckCircle, XCircle, MinusCircle, Plus, BarChart3 } from 'lucide-react';
import { VotingDialog } from './VotingDialog';

export const VotingModule: React.FC = () => {
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [voteType, setVoteType] = useState<'favor' | 'against' | 'abstain'>('favor');

  const handleVoteClick = (poll: any, type: 'favor' | 'against' | 'abstain') => {
    setSelectedPoll(poll);
    setVoteType(type);
    setShowVotingDialog(true);
  };

  const activePolls = [
    {
      id: 1,
      title: 'Temple Expansion Budget Approval',
      description: 'Approval for additional ₹50 lakhs for temple expansion project',
      deadline: '2024-01-25 5:00 PM',
      totalVoters: 12,
      votedCount: 8,
      votes: { favor: 6, against: 1, abstain: 1 },
      status: 'active',
      isSecret: true
    },
    {
      id: 2,
      title: 'New Festival Committee Formation',
      description: 'Proposal to form a dedicated festival planning committee',
      deadline: '2024-01-30 12:00 PM',
      totalVoters: 12,
      votedCount: 5,
      votes: { favor: 4, against: 0, abstain: 1 },
      status: 'active',
      isSecret: false
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
      turnout: 100
    }
  ];

  const getProgressPercentage = (poll: any) => {
    return (poll.votedCount / poll.totalVoters) * 100;
  };

  const getResultPercentages = (votes: any) => {
    const total = votes.favor + votes.against + votes.abstain;
    return {
      favor: total > 0 ? (votes.favor / total) * 100 : 0,
      against: total > 0 ? (votes.against / total) * 100 : 0,
      abstain: total > 0 ? (votes.abstain / total) * 100 : 0
    };
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voting System</h1>
            <p className="text-gray-600">Manage polls, ballots, and voting processes</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
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
              {activePolls.map((poll) => {
                const percentages = getResultPercentages(poll.votes);
                return (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{poll.title}</CardTitle>
                          <CardDescription className="mt-2">{poll.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className="bg-success text-white">{poll.status}</Badge>
                          {poll.isSecret && <Badge variant="secondary">Secret Ballot</Badge>}
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

                        {!poll.isSecret && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-success" />
                                <span className="font-semibold">Favor</span>
                              </div>
                              <div className="text-2xl font-bold text-success">{poll.votes.favor}</div>
                              <div className="text-sm text-gray-500">{Math.round(percentages.favor)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <XCircle className="h-5 w-5 text-error" />
                                <span className="font-semibold">Against</span>
                              </div>
                              <div className="text-2xl font-bold text-error">{poll.votes.against}</div>
                              <div className="text-sm text-gray-500">{Math.round(percentages.against)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <MinusCircle className="h-5 w-5 text-warning" />
                                <span className="font-semibold">Abstain</span>
                              </div>
                              <div className="text-2xl font-bold text-warning">{poll.votes.abstain}</div>
                              <div className="text-sm text-gray-500">{Math.round(percentages.abstain)}%</div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-4 border-t">
                          <Button 
                            className="bg-success hover:bg-success/90 text-white"
                            onClick={() => handleVoteClick(poll, 'favor')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Vote Favor
                          </Button>
                          <Button 
                            className="bg-error hover:bg-error/90 text-white"
                            onClick={() => handleVoteClick(poll, 'against')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Vote Against
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleVoteClick(poll, 'abstain')}
                          >
                            <MinusCircle className="h-4 w-4 mr-2" />
                            Abstain
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedPolls.map((poll) => {
                const percentages = getResultPercentages(poll.votes);
                return (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        <Badge className={poll.result === 'Approved' ? 'bg-success text-white' : 'bg-error text-white'}>
                          {poll.result}
                        </Badge>
                      </div>
                      <CardDescription>Completed on {poll.completedDate}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">{poll.votes.favor}</div>
                          <div className="text-sm text-gray-500">Favor ({Math.round(percentages.favor)}%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-error">{poll.votes.against}</div>
                          <div className="text-sm text-gray-500">Against ({Math.round(percentages.against)}%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-warning">{poll.votes.abstain}</div>
                          <div className="text-sm text-gray-500">Abstain ({Math.round(percentages.abstain)}%)</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Turnout: {poll.turnout}%</span>
                        <span>{poll.totalVoters} total voters</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
        voteType={voteType}
      />
    </>
  );
};
