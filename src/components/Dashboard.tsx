
import React from 'react';
import { Calendar, FileText, Users, Mail, Clock, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const Dashboard: React.FC = () => {
  const upcomingMeetings = [
    {
      id: 1,
      title: 'Monthly Bureau Meeting',
      date: 'Today, 2:00 PM',
      attendees: 12,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Temple Committee Review',
      date: 'Tomorrow, 10:00 AM',
      attendees: 8,
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Festival Planning',
      date: 'Dec 15, 3:00 PM',
      attendees: 15,
      status: 'scheduled'
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Q4 Financial Report.pdf',
      uploadedBy: 'Secretary',
      date: '2 hours ago',
      views: 24
    },
    {
      id: 2,
      name: 'Temple Renovation Proposal.docx',
      uploadedBy: 'Project Manager',
      date: '1 day ago',
      views: 18
    },
    {
      id: 3,
      name: 'Festival Budget 2024.xlsx',
      uploadedBy: 'Treasurer',
      date: '2 days ago',
      views: 31
    }
  ];

  const activeVotings = [
    {
      id: 1,
      title: 'Temple Renovation Budget Approval',
      endDate: '2 days left',
      votes: { favor: 8, against: 2, abstain: 1 },
      total: 15
    },
    {
      id: 2,
      title: 'New Committee Member Selection',
      endDate: '5 days left',
      votes: { favor: 12, against: 1, abstain: 2 },
      total: 15
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, General Secretary</h1>
        <p className="text-primary-foreground/90">Here's what's happening in your bureau today.</p>
        <div className="flex items-center mt-4 space-x-4 text-sm">
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            3 meetings this week
          </span>
          <span className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            12 new documents
          </span>
          <span className="flex items-center">
            <Check className="h-4 w-4 mr-1" />
            2 active votes
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month's Meetings</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Meetings</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
            <CardDescription>Your scheduled meetings and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {meeting.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={meeting.status === 'upcoming' ? 'default' : 'secondary'}>
                      {meeting.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{meeting.attendees} attendees</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Documents</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
            <CardDescription>Latest uploaded and accessed files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{doc.name}</h4>
                      <p className="text-xs text-gray-600">by {doc.uploadedBy} • {doc.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{doc.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Voting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Voting</span>
            <Button variant="outline" size="sm">Create Vote</Button>
          </CardTitle>
          <CardDescription>Current votes requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVotings.map((vote) => (
              <div key={vote.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{vote.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {vote.endDate}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Favor: {vote.votes.favor}</span>
                    <span className="text-red-600">Against: {vote.votes.against}</span>
                    <span className="text-gray-600">Abstain: {vote.votes.abstain}</span>
                  </div>
                  <Progress 
                    value={(vote.votes.favor / vote.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    {vote.votes.favor + vote.votes.against + vote.votes.abstain} of {vote.total} votes cast
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50">
                    Favor
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    Against
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Abstain
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your bureau</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900">Meeting minutes uploaded</span>
                <span className="text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-900">New member added to committee</span>
                <span className="text-gray-500">5 hours ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-900">Document shared via email</span>
                <span className="text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-900">Voting session completed</span>
                <span className="text-gray-500">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Notifications</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Urgent: Meeting agenda approval needed</p>
                  <p className="text-xs text-red-700">Due in 2 hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Document review pending</p>
                  <p className="text-xs text-yellow-700">3 documents waiting for approval</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">New messages</p>
                  <p className="text-xs text-blue-700">5 unread emails from committee members</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
