
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Paperclip, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';

export const EmailModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { emails, loading, fetchEmails, markAsRead } = useEmails();

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
          <p className="text-gray-600">View and manage all communications</p>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
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
      </Tabs>
    </div>
  );
};
