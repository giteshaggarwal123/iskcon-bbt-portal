import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Paperclip, Users, Eye, Clock, CheckCircle, Plus, Search } from 'lucide-react';
import { ComposeEmailDialog } from './ComposeEmailDialog';

export const EmailModule: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showComposeDialog, setShowComposeDialog] = useState(false);

  const emails = [
    {
      id: 1,
      subject: 'Meeting Agenda - Monthly Bureau Meeting',
      recipients: ['All Bureau Members'],
      sentDate: '2024-01-18 2:30 PM',
      status: 'delivered',
      openRate: 85,
      readCount: 10,
      totalRecipients: 12,
      hasAttachments: true
    },
    {
      id: 2,
      subject: 'Document Review: Temple Construction Policy',
      recipients: ['Building Committee'],
      sentDate: '2024-01-17 10:15 AM',
      status: 'sent',
      openRate: 75,
      readCount: 6,
      totalRecipients: 8,
      hasAttachments: true
    }
  ];

  const templates = [
    { id: 1, name: 'Meeting Invitation', category: 'Meetings' },
    { id: 2, name: 'Document Review Request', category: 'Documents' },
    { id: 3, name: 'Voting Reminder', category: 'Voting' },
    { id: 4, name: 'Attendance Follow-up', category: 'Attendance' }
  ];

  const contacts = [
    { name: 'Radha Krishna Das', email: 'radha.krishna@iskcon.org', role: 'General Secretary' },
    { name: 'Govinda Maharaj', email: 'govinda@iskcon.org', role: 'Bureau Member' },
    { name: 'Gauranga Prabhu', email: 'gauranga@iskcon.org', role: 'Bureau Member' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success text-white">Delivered</Badge>;
      case 'sent':
        return <Badge className="bg-primary text-white">Sent</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
            <p className="text-gray-600">Send, track, and manage all communications</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowComposeDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </div>

        <Tabs defaultValue="inbox" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-6">
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search emails..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="bg-secondary/50 rounded-lg p-8 text-center">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Email integration will be configured here</p>
              <p className="text-sm text-gray-500 mt-2">Connect your existing email accounts to manage all communications</p>
            </div>
          </TabsContent>

          <TabsContent value="compose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compose New Email</CardTitle>
                <CardDescription>Send emails with document attachments and tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <Input placeholder="Select recipients or enter emails" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Template</label>
                    <select 
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select template (optional)</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} - {template.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Enter email subject" />
                </div>

                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Type your message here..."
                    rows={8}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Files
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline">Save Draft</Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-6">
            <div className="grid gap-6">
              {emails.map((email) => (
                <Card key={email.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{email.subject}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{email.recipients.join(', ')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{email.sentDate}</span>
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {email.hasAttachments && (
                          <Badge variant="secondary">
                            <Paperclip className="h-3 w-3 mr-1" />
                            Attachments
                          </Badge>
                        )}
                        {getStatusBadge(email.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{email.totalRecipients}</div>
                        <div className="text-sm text-gray-500">Recipients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{email.readCount}</div>
                        <div className="text-sm text-gray-500">Read</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">{email.openRate}%</div>
                        <div className="text-sm text-gray-500">Open Rate</div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Read Receipts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">Use</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <div className="grid gap-4">
              {contacts.map((contact, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                          <p className="text-sm text-gray-500">{contact.email}</p>
                          <p className="text-xs text-gray-400">{contact.role}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ComposeEmailDialog 
        open={showComposeDialog} 
        onOpenChange={setShowComposeDialog} 
      />
    </>
  );
};
