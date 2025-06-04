import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Paperclip, Users, Eye, Clock, CheckCircle, Plus, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { ComposeEmailDialog } from './ComposeEmailDialog';
import { useEmails } from '@/hooks/useEmails';

export const EmailModule: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { emails, loading, fetchEmails, markAsRead } = useEmails();

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

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === 'high') {
      return <Badge className="bg-red-500 text-white">High</Badge>;
    }
    return null;
  };

  const handleOpenInOutlook = (email: any) => {
    // Construct Outlook web URL to open the specific email
    const outlookUrl = `https://outlook.office.com/mail/inbox/id/${email.id}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={fetchEmails} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEmails.length > 0 ? (
              <div className="space-y-4">
                {filteredEmails.map((email) => (
                  <Card 
                    key={email.id} 
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      !email.isRead ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => markAsRead(email.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-medium ${!email.isRead ? 'font-semibold' : ''}`}>
                              {email.from.name}
                            </h3>
                            <span className="text-sm text-gray-500">&lt;{email.from.address}&gt;</span>
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <h4 className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 mb-2`}>
                            {email.subject}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {email.body.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(email.receivedDateTime)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {email.hasAttachments && (
                              <Badge variant="secondary">
                                <Paperclip className="h-3 w-3 mr-1" />
                                Attachment
                              </Badge>
                            )}
                            {getImportanceBadge(email.importance)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInOutlook(email);
                              }}
                              className="h-6 px-2 text-blue-600 hover:bg-blue-100"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Outlook
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No emails found matching your search' : 'No emails found'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {emails.length === 0 ? 'Make sure your Microsoft account is connected in Settings' : ''}
                </p>
              </div>
            )}
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
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Sent emails will appear here</p>
              <p className="text-sm text-gray-500 mt-2">Track delivery and read receipts for sent messages</p>
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
