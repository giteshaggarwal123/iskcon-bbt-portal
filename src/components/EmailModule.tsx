
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Paperclip, Search, RefreshCw, ExternalLink, Circle } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';
import { useIsMobile } from '@/hooks/use-mobile';

export const EmailModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { emails, loading, fetchEmails, markAsRead } = useEmails();
  const isMobile = useIsMobile();

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === 'high') {
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    }
    return null;
  };

  const handleOpenInOutlook = (email: any) => {
    const outlookUrl = `https://outlook.office.com/mail/inbox/id/${email.id}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`w-full mx-auto space-y-6 ${isMobile ? 'p-4' : 'max-w-7xl p-6'}`}>
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Email</h1>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>Manage your communications</p>
      </div>

      {/* Search and Actions Bar */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 items-start sm:items-center`}>
        <div className={`${isMobile ? 'w-full' : 'flex-1 max-w-md'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in mail"
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchEmails} 
          disabled={loading}
          className={`flex items-center gap-2 border-gray-300 hover:bg-gray-50 ${isMobile ? 'w-full' : ''}`}
          size={isMobile ? "sm" : "default"}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className={`flex items-center justify-center ${isMobile ? 'py-12' : 'py-16'}`}>
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Loading emails...</p>
            </div>
          </div>
        ) : filteredEmails.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredEmails.map((email, index) => (
              <div
                key={email.id}
                className={`group hover:bg-gray-50 transition-colors cursor-pointer ${
                  !email.isRead ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => markAsRead(email.id)}
              >
                <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                  <div className={`flex items-start ${isMobile ? 'gap-2' : 'justify-between gap-4'}`}>
                    {/* Left side - Email content */}
                    <div className={`flex items-start flex-1 min-w-0 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                      {/* Unread indicator */}
                      {!email.isRead && (
                        <Circle className="h-2 w-2 fill-blue-500 text-blue-500 mt-2 flex-shrink-0" />
                      )}
                      
                      {/* Email details */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 ${isMobile ? 'mb-1' : 'mb-1'}`}>
                          <span className={`truncate ${
                            !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          } ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {email.from.name}
                          </span>
                          {email.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                          {getImportanceBadge(email.importance)}
                        </div>
                        
                        <div className={isMobile ? 'mb-1' : 'mb-1'}>
                          <span className={`${
                            !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                          } line-clamp-1 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {email.subject || 'No Subject'}
                          </span>
                        </div>
                        
                        <p className={`text-gray-600 line-clamp-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {email.body.replace(/<[^>]*>/g, '').substring(0, isMobile ? 60 : 100)}
                          {email.body.replace(/<[^>]*>/g, '').length > (isMobile ? 60 : 100) ? '...' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Date and actions */}
                    <div className={`flex ${isMobile ? 'flex-col items-end' : 'items-center'} gap-2 flex-shrink-0`}>
                      <span className={`text-gray-500 min-w-fit ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {formatDate(email.receivedDateTime)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInOutlook(email);
                        }}
                        className={`transition-opacity text-blue-600 hover:bg-blue-100 ${
                          isMobile ? 'opacity-100 h-6 px-2 text-xs' : 'opacity-0 group-hover:opacity-100 h-8 px-3'
                        }`}
                      >
                        <ExternalLink className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3 mr-1'}`} />
                        {!isMobile && 'Open'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
            <div className="flex flex-col items-center space-y-4">
              <div className={`bg-gray-100 rounded-full flex items-center justify-center ${
                isMobile ? 'w-12 h-12' : 'w-16 h-16'
              }`}>
                <Mail className={`text-gray-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
              <div className="space-y-2">
                <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {searchTerm ? 'No emails found' : 'No emails'}
                </h3>
                <p className={`text-gray-500 max-w-sm ${isMobile ? 'text-sm px-4' : 'text-sm'}`}>
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : emails.length === 0 
                      ? 'Connect your Microsoft account in Settings to view emails'
                      : 'All caught up! No new emails to show.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
