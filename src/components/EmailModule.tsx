
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Paperclip, Search, RefreshCw, ExternalLink, Circle } from 'lucide-react';
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
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleOpenInOutlook = (email: any) => {
    const outlookUrl = `https://outlook.office.com/mail/inbox/id/${email.id}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredEmails.length} {filteredEmails.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
          <Button variant="outline" onClick={fetchEmails} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEmails.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                    !email.isRead 
                      ? 'bg-blue-50 border-l-blue-500' 
                      : 'bg-white border-l-transparent hover:border-l-gray-200'
                  }`}
                  onClick={() => markAsRead(email.id)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar/Circle */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      !email.isRead ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {email.from.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm ${!email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {email.from.name}
                          </h3>
                          {!email.isRead && (
                            <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(email.receivedDateTime)}
                        </span>
                      </div>

                      <h4 className={`text-sm mb-2 truncate ${
                        !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'
                      }`}>
                        {email.subject}
                      </h4>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {email.body.replace(/<[^>]*>/g, '').substring(0, 120)}...
                      </p>

                      {/* Email Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {email.hasAttachments && (
                            <Badge variant="secondary" className="text-xs">
                              <Paperclip className="h-3 w-3 mr-1" />
                              Attachment
                            </Badge>
                          )}
                          {email.importance === 'high' && (
                            <Badge className="bg-red-500 text-white text-xs">High</Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInOutlook(email);
                          }}
                          className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-100"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open in Outlook
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No emails found' : 'Your inbox is empty'}
            </h3>
            <p className="text-gray-500 max-w-sm">
              {searchTerm 
                ? 'Try adjusting your search terms or check for typos.' 
                : emails.length === 0 
                  ? 'Make sure your Microsoft account is connected in Settings to view emails.'
                  : 'All caught up! No new messages to display.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
