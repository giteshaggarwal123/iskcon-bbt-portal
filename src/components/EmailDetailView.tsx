
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Paperclip, ExternalLink, Calendar, User } from 'lucide-react';
import { Email } from '@/hooks/useEmails';

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
  onOpenInOutlook: (email: Email) => void;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({
  email,
  onBack,
  onOpenInOutlook
}) => {
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === 'high') {
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    }
    return null;
  };

  // Clean and format email body
  const formatEmailBody = (body: string) => {
    // Remove HTML tags and decode HTML entities
    const cleanText = body
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    return cleanText;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onOpenInOutlook(email)}
          className="flex items-center gap-2 ml-auto"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Outlook
        </Button>
      </div>

      {/* Email Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Email Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="space-y-4">
            {/* Subject and Priority */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 flex-1">
                {email.subject || 'No Subject'}
              </h1>
              {getImportanceBadge(email.importance)}
            </div>

            {/* Sender Information */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {email.from.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    &lt;{email.from.address}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatFullDate(email.receivedDateTime)}
                  </div>
                  {email.hasAttachments && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="h-4 w-4" />
                      Has attachments
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {formatEmailBody(email.body) || 'This email has no content.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Email ID: {email.id}
            </div>
            <Button
              variant="default"
              onClick={() => onOpenInOutlook(email)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Outlook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
