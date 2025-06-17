
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Paperclip, ExternalLink, Calendar, User, Copy } from 'lucide-react';
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Email Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="space-y-6">
            {/* Subject and Priority */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 flex-1">
                {email.subject || 'No Subject'}
              </h1>
              {getImportanceBadge(email.importance)}
            </div>

            {/* Email Recipients Section - Outlook Style */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              {/* From */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">From:</span>
                    <span className="font-medium text-gray-900">{email.from.name}</span>
                    <button 
                      onClick={() => copyToClipboard(email.from.address)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Copy email address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    &lt;{email.from.address}&gt;
                  </div>
                </div>
              </div>

              {/* To Section */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-green-700">TO</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">To:</span>
                    <span className="text-sm text-gray-900">Me</span>
                    <button 
                      onClick={() => copyToClipboard('current-user@email.com')}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Copy email address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CC Section (if applicable) */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-yellow-700">CC</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Cc:</span>
                    <span className="text-sm text-gray-500 italic">None</span>
                  </div>
                </div>
              </div>

              {/* BCC Section (if applicable) */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-purple-700">BCC</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Bcc:</span>
                    <span className="text-sm text-gray-500 italic">None</span>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Sent: {formatFullDate(email.receivedDateTime)}
                </span>
                {email.hasAttachments && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Has attachments</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6">
          <div className="prose max-w-none">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                {formatEmailBody(email.body) || 'This email has no content.'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Message ID: {email.id.substring(0, 20)}...
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(email.from.address)}
                className="flex items-center gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy Sender
              </Button>
              <Button
                variant="default"
                size="sm"
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
    </div>
  );
};
