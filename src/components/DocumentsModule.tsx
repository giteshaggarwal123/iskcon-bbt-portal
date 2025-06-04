
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { File, Upload, Search, Folder, Plus, Cloud, Database, RefreshCw } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { CreateFolderDialog } from './CreateFolderDialog';
import { SharePointDocuments } from './SharePointDocuments';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

export const DocumentsModule: React.FC = () => {
  const { documents, folders, loading, uploadDocument, searchDocuments, fetchDocuments } = useDocuments();
  const { isConnected } = useMicrosoftAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('general');
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  const handleUpload = async () => {
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadDocument(selectedFiles[i], selectedFolder);
    }
    
    setSelectedFiles(null);
    setUploadDialogOpen(false);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchDocuments(searchTerm);
    } else {
      fetchDocuments();
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Organize and manage bureau documents</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center space-x-1">
            <Cloud className="h-3 w-3" />
            <span>{isConnected ? 'SharePoint Connected' : 'SharePoint Disconnected'}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="sharepoint" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sharepoint" className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>SharePoint Documents</span>
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Local Storage</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sharepoint" className="space-y-6">
          <SharePointDocuments />
        </TabsContent>

        <TabsContent value="local" className="space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>Upload files to the local document storage</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="files">Select Files</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder">Folder</Label>
                      <select
                        id="folder"
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="general">General</option>
                        {folders.map((folder) => (
                          <option key={folder} value={folder}>{folder}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={!selectedFiles}>
                        Upload
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>

              <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          {/* Folders */}
          {folders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Folders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <div key={folder} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Folder className="h-6 w-6 text-blue-600" />
                      <span className="text-sm font-medium truncate">{folder}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <File className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>Uploaded {formatDate(doc.created_at)}</span>
                            {doc.folder && (
                              <Badge variant="secondary">{doc.folder}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No documents match your search' : 'Upload your first document to get started'}
              </p>
            </div>
          )}

          <CreateFolderDialog 
            open={showFolderDialog} 
            onOpenChange={setShowFolderDialog} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
