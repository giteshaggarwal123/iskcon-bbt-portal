
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Upload, Search, Download, Trash2, Eye, Plus, Edit, Copy, Star, MoreHorizontal } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentAnalytics } from './DocumentAnalytics';

export const DocumentsModule: React.FC = () => {
  const { documents, loading, uploadDocument, deleteDocument, fetchDocuments } = useDocuments();
  const { user } = useAuth();
  const { isSuperAdmin, canDeleteContent } = useUserRole();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [peopleFilter, setPeopleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {first_name: string, last_name: string}}>({});

  // Fetch user profiles for displaying names
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (error) throw error;

        const profilesMap = data.reduce((acc, profile) => {
          acc[profile.id] = {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          };
          return acc;
        }, {});

        setUserProfiles(profilesMap);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    fetchUserProfiles();
  }, []);

  // Get unique uploaders for people filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploaded_by))];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    // Upload to 'general' folder by default, or 'personal' if it's a member
    const folder = isSuperAdmin ? 'general' : 'personal';
    await uploadDocument(selectedFile, folder);
    setSelectedFile(null);
    setUploadDialogOpen(false);
  };

  const handleToggleImportant = async (documentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_important: !currentStatus })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document Updated",
        description: `Document ${!currentStatus ? 'marked as important' : 'unmarked as important'}`
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update document",
        variant: "destructive"
      });
    }
  };

  const handleRename = async () => {
    if (!selectedDocument || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      toast({
        title: "Document Renamed",
        description: "Document has been renamed successfully"
      });

      setRenameDialogOpen(false);
      setSelectedDocument(null);
      setNewName('');
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  const handleCopyDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          name: `Copy of ${document.name}`,
          file_path: document.file_path,
          file_size: document.file_size,
          mime_type: document.mime_type,
          folder: document.folder,
          uploaded_by: user?.id || document.uploaded_by,
        });

      if (error) throw error;

      toast({
        title: "Document Copied",
        description: "Document has been copied successfully"
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Document Deleted",
        description: `"${documentName}" has been permanently deleted`
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (document: any) => {
    // For now, just show a message
    toast({
      title: "View Document",
      description: "Document viewing will be implemented soon"
    });
  };

  const handleDownloadDocument = (document: any) => {
    // For now, just show a message
    toast({
      title: "Download Document",
      description: "Document download will be implemented soon"
    });
  };

  // Filter documents based on access control and filters
  const filteredDocuments = documents.filter(doc => {
    // Access control
    if (!isSuperAdmin) {
      // Members can only see non-hidden documents and their own documents
      if (doc.is_hidden && doc.uploaded_by !== user?.id) {
        return false;
      }
      // Members can't see other people's personal folders
      if (doc.folder === 'personal' && doc.uploaded_by !== user?.id) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'pdf' && doc.mime_type?.includes('pdf')) ||
      (typeFilter === 'word' && (doc.mime_type?.includes('word') || doc.mime_type?.includes('document'))) ||
      (typeFilter === 'excel' && (doc.mime_type?.includes('sheet') || doc.mime_type?.includes('excel'))) ||
      (typeFilter === 'image' && doc.mime_type?.includes('image'));
    
    // People filter
    const matchesPeople = peopleFilter === 'all' || doc.uploaded_by === peopleFilter;
    
    // Date filter
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && new Date(doc.created_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(doc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && new Date(doc.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesType && matchesPeople && matchesDate;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4" />;
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return 'You';
    const profile = userProfiles[userId];
    if (profile && (profile.first_name || profile.last_name)) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    return 'User';
  };

  // Check if user can delete a specific document
  const canDeleteDocument = (document: any) => {
    return canDeleteContent || user?.id === document.uploaded_by;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Document Repository</h1>
          <p className="text-gray-600">
            Manage and organize your documents • {filteredDocuments.length} documents
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Upload Document</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Select a file to upload to the document repository
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex space-x-4 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="image">Images</SelectItem>
            </SelectContent>
          </Select>

          <Select value={peopleFilter} onValueChange={setPeopleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="People" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {uniqueUploaders.map(uploaderId => (
                <SelectItem key={uploaderId} value={uploaderId}>
                  {getUserDisplayName(uploaderId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Modified By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((document) => (
              <ContextMenu key={document.id}>
                <ContextMenuTrigger asChild>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFileIcon(document.mime_type)}
                        {document.is_important && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{document.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {document.folder || 'general'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {document.mime_type?.split('/')[1] || 'file'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>{formatDate(document.updated_at || document.created_at)}</TableCell>
                    <TableCell>{getUserDisplayName(document.uploaded_by)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={() => handleDownloadDocument(document)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        
                        <DocumentAnalytics 
                          documentId={document.id}
                          documentName={document.name}
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 px-2">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleToggleImportant(document.id, document.is_important)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {document.is_important ? 'Unmark Important' : 'Mark Important'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDocument(document);
                                setNewName(document.name);
                                setRenameDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyDocument(document.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canDeleteDocument(document) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{document.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteDocument(document.id, document.name)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleViewDocument(document)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleDownloadDocument(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleToggleImportant(document.id, document.is_important)}>
                    <Star className="h-4 w-4 mr-2" />
                    {document.is_important ? 'Unmark Important' : 'Mark Important'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCopyDocument(document.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Document
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  {canDeleteDocument(document) && (
                    <ContextMenuItem 
                      onClick={() => handleDeleteDocument(document.id, document.name)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </TableBody>
        </Table>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter !== 'all' || peopleFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by uploading your first document'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for the document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newName">Document Name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new document name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={!newName.trim()}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
