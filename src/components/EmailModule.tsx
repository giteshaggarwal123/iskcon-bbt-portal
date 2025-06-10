
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, 
  Paperclip, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Circle, 
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const EmailModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const { emails, loading, fetchEmails, markAsRead, deleteEmail, deleteMultipleEmails, deleting } = useEmails();

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

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, emailId]);
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(filteredEmails.map(email => email.id));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleDeleteSingle = async (emailId: string) => {
    setEmailToDelete(emailId);
    setShowDeleteDialog(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedEmails.length === 0) return;
    await deleteMultipleEmails(selectedEmails);
    setSelectedEmails([]);
  };

  const confirmDelete = async () => {
    if (emailToDelete) {
      await deleteEmail(emailToDelete);
      setEmailToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  const isAllSelected = filteredEmails.length > 0 && selectedEmails.length === filteredEmails.length;
  const isSomeSelected = selectedEmails.length > 0 && selectedEmails.length < filteredEmails.length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Email</h1>
        <p className="text-sm text-gray-600">Manage your communications</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-md">
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
        
        <div className="flex gap-2">
          {selectedEmails.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={deleting.some(id => selectedEmails.includes(id))}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedEmails.length})
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={fetchEmails} 
            disabled={loading}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading emails...</p>
            </div>
          </div>
        ) : filteredEmails.length > 0 ? (
          <>
            {/* Select All Header */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {selectedEmails.length > 0 
                    ? `${selectedEmails.length} of ${filteredEmails.length} selected`
                    : `${filteredEmails.length} emails`
                  }
                </span>
              </div>
            </div>

            {/* Email List */}
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email, index) => (
                <div
                  key={email.id}
                  className={`group hover:bg-gray-50 transition-colors ${
                    !email.isRead ? 'bg-blue-50/30' : ''
                  } ${deleting.includes(email.id) ? 'opacity-50' : ''}`}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Checkbox and Email content */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                          disabled={deleting.includes(email.id)}
                          className="mt-1"
                        />

                        {/* Unread indicator */}
                        {!email.isRead && (
                          <Circle className="h-2 w-2 fill-blue-500 text-blue-500 mt-2 flex-shrink-0" />
                        )}
                        
                        {/* Email details */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => markAsRead(email.id)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm truncate ${
                              !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}>
                              {email.from.name}
                            </span>
                            {email.hasAttachments && (
                              <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            )}
                            {getImportanceBadge(email.importance)}
                          </div>
                          
                          <div className="mb-1">
                            <span className={`text-sm ${
                              !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                            } line-clamp-1`}>
                              {email.subject || 'No Subject'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}
                            {email.body.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right side - Date and actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-500 min-w-fit">
                          {formatDate(email.receivedDateTime)}
                        </span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSingle(email.id);
                            }}
                            disabled={deleting.includes(email.id)}
                            className="h-8 px-3 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInOutlook(email);
                            }}
                            className="h-8 px-3 text-blue-600 hover:bg-blue-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'No emails found' : 'No emails'}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email? This action cannot be undone and the email will be permanently removed from your mailbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
