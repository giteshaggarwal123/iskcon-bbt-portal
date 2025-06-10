
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Mail, Send, Trash2, Search, Filter, FileText, Paperclip, Users, Calendar, Clock, CheckSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmails } from '@/hooks/useEmails';
import { ComposeEmailDialog } from './ComposeEmailDialog';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const EmailModule: React.FC = () => {
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const { emails, loading, deleteEmail, deleteMultipleEmails, deleting } = useEmails();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter emails based on search and importance
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesImportance = importanceFilter === 'all' || email.importance === importanceFilter;
    return matchesSearch && matchesImportance;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(new Set(filteredEmails.map(email => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleDeleteClick = (emailId: string) => {
    setEmailToDelete(emailId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!emailToDelete) return;

    const email = emails.find(e => e.id === emailToDelete);
    if (!email) {
      toast({
        title: "Email Not Found",
        description: "The email you're trying to delete was not found",
        variant: "destructive"
      });
      setShowDeleteDialog(false);
      setEmailToDelete(null);
      return;
    }

    toast({
      title: "Deleting Email",
      description: `Removing "${email.subject}"...`,
    });

    const success = await deleteEmail(emailToDelete);
    
    setShowDeleteDialog(false);
    setEmailToDelete(null);

    if (success && selectedEmails.has(emailToDelete)) {
      const newSelected = new Set(selectedEmails);
      newSelected.delete(emailToDelete);
      setSelectedEmails(newSelected);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) {
      toast({
        title: "No Emails Selected",
        description: "Please select emails to delete",
        variant: "destructive"
      });
      return;
    }

    const result = await deleteMultipleEmails(Array.from(selectedEmails));
    
    if (result.success > 0) {
      setSelectedEmails(new Set());
      // Update select all checkbox
      if (selectAllRef.current) {
        selectAllRef.current.checked = false;
        selectAllRef.current.indeterminate = false;
      }
    }
  };

  // Update select all checkbox state
  React.useEffect(() => {
    if (selectAllRef.current) {
      const checkbox = selectAllRef.current;
      if (selectedEmails.size === 0) {
        checkbox.checked = false;
        checkbox.indeterminate = false;
      } else if (selectedEmails.size === filteredEmails.length) {
        checkbox.checked = true;
        checkbox.indeterminate = false;
      } else {
        checkbox.checked = false;
        checkbox.indeterminate = true;
      }
    }
  }, [selectedEmails.size, filteredEmails.length]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'normal':
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getReadStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge className="bg-green-100 text-green-800">Read</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800">Unread</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
            <p className="text-gray-600 mt-1">View and manage emails from your Outlook inbox</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowComposeDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search emails by subject or sender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={importanceFilter} onValueChange={setImportanceFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Importance</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedEmails.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-800">
              {selectedEmails.size} email{selectedEmails.size === 1 ? '' : 's'} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={Array.from(selectedEmails).some(id => deleting.includes(id))}
            >
              {Array.from(selectedEmails).some(id => deleting.includes(id)) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </>
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {filteredEmails.length > 0 ? (
            <div className="space-y-4">
              {/* Select All Header */}
              <div className="flex items-center space-x-2 p-4 border-b">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {filteredEmails.map((email) => {
                const isDeleting = deleting.includes(email.id);
                
                return (
                  <Card key={email.id} className={`hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 flex-1">
                          <Checkbox
                            checked={selectedEmails.has(email.id)}
                            onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                            disabled={isDeleting}
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg flex items-start gap-2">
                              <span className="break-words">{email.subject}</span>
                              {isDeleting && (
                                <Badge className="bg-orange-500 text-white animate-pulse">
                                  DELETING...
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  From: {email.from.name || email.from.address}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(email.receivedDateTime)}
                                </span>
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getReadStatusBadge(email.isRead)}
                          {getImportanceBadge(email.importance)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {email.body ? email.body.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No content'}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" disabled={isDeleting}>
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(email.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No emails found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm || importanceFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Connect your Microsoft account in Settings to view emails'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ComposeEmailDialog 
        open={showComposeDialog} 
        onOpenChange={setShowComposeDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email? This action cannot be undone and will also delete the email from your Outlook account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailModule;
