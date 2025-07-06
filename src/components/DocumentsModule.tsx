import React, { useState, useMemo } from 'react';
import { Input, SearchInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Plus, Grid, List, Home, ArrowLeft, ChevronLeft, Search, Trash2, Download, Star, StarOff } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FolderSection } from './documents/FolderSection';
import { FileSection } from './documents/FileSection';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';
import { TrashFolder } from './documents/TrashFolder';
import { DocumentViewer } from './DocumentViewer';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';

export const DocumentsModule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [renameDocument, setRenameDocument] = useState<any>(null);
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isInTrash, setIsInTrash] = useState(false);

  const {
    documents,
    folders,
    userProfiles,
    uploadDocument,
    createFolder,
    deleteDocument,
    deleteFolder,
    renameDocumentMutation,
    moveDocument,
    refreshDocuments,
    toggleImportant
  } = useDocuments(selectedFolder);

  // Unified search for folders and files
  const isSearching = !!searchTerm.trim();
  const folderIdForFilter = selectedFolder || '';
  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    if (!isSearching) return folders.filter(f => (f.parent_folder_id ?? '') === folderIdForFilter);
    return folders.filter(f => f.name && f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [folders, folderIdForFilter, searchTerm, isSearching]);

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    if (!isSearching) return documents.filter(d => (d.folder_id ?? '') === folderIdForFilter);
    return documents.filter(d => d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [documents, folderIdForFilter, searchTerm, isSearching]);

  // Breadcrumbs
  const getBreadcrumbPath = () => {
    if (!selectedFolder || !folders || folders.length === 0) return [];
    const path = [];
    let currentFolderId = selectedFolder;
    let depth = 0;
    const maxDepth = 10;
    while (currentFolderId && depth < maxDepth) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        path.unshift(folder);
        currentFolderId = folder.parent_folder_id;
      } else {
        break;
      }
      depth++;
    }
    return path;
  };
  const breadcrumbPath = getBreadcrumbPath();

  // Wrap deleteFolder to match (folderId: string) => Promise<boolean>
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder.mutateAsync(folderId);
      toast({ title: 'Success', description: 'Folder deleted successfully' });
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete folder', variant: 'destructive' });
      return false;
    }
  };

  // Wrap moveDocument to match (documentId: string, targetFolderId: string | null) => void
  const handleMoveDocument = async (documentId: string, targetFolderId: string | null) => {
    await moveDocument.mutateAsync({ documentId, targetFolderId });
  };

  // Wrap onDeleteDocument for FileSection
  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      await deleteDocument.mutateAsync(documentId);
      toast({ title: 'Success', description: `"${documentName}" moved to trash` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete document', variant: 'destructive' });
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedDocumentIds.length === 0) return;
    
    try {
      const selectedDocuments = filteredDocuments.filter(doc => selectedDocumentIds.includes(doc.id));
      for (const doc of selectedDocuments) {
        await deleteDocument.mutateAsync(doc.id);
      }
      setSelectedDocumentIds([]);
      toast({ title: 'Success', description: `${selectedDocuments.length} document(s) moved to trash` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete documents', variant: 'destructive' });
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocumentIds.length === 0) return;
    const selectedDocuments = filteredDocuments.filter(doc => selectedDocumentIds.includes(doc.id));
    if (selectedDocuments.length === 1) {
      // Single file: direct download
      const doc = selectedDocuments[0];
      if (typeof doc.file_path === 'string' && doc.file_path) {
        const a = document.createElement('a');
        a.href = doc.file_path;
        a.download = doc.name || 'document';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast({ title: 'Download Started', description: `Started download for 1 document.` });
      } else {
        toast({ title: 'No Download', description: 'No downloadable document found.', variant: 'destructive' });
      }
      return;
    }
    // Multiple files: zip and download
    const zip = new JSZip();
    let added = 0;
    for (const doc of selectedDocuments) {
      if (typeof doc.file_path === 'string' && doc.file_path) {
        try {
          const response = await fetch(doc.file_path);
          if (!response.ok) continue;
          const blob = await response.blob();
          zip.file(doc.name || `document-${doc.id}`, blob);
          added++;
        } catch (e) {
          // skip file if fetch fails
        }
      }
    }
    if (added === 0) {
      toast({ title: 'No Download', description: 'No downloadable documents found.', variant: 'destructive' });
      return;
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast({ title: 'Download Started', description: `Started download for ${added} documents as ZIP.` });
  };

  const handleBulkToggleImportant = async (makeImportant: boolean) => {
    if (selectedDocumentIds.length === 0) return;
    try {
      const selectedDocuments = filteredDocuments.filter(doc => selectedDocumentIds.includes(doc.id));
      for (const doc of selectedDocuments) {
        await toggleImportant.mutateAsync({ documentId: doc.id, isImportant: makeImportant });
      }
      setSelectedDocumentIds([]);
      toast({ title: 'Success', description: `${selectedDocuments.length} document(s) ${makeImportant ? 'marked as' : 'unmarked from'} important` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update documents', variant: 'destructive' });
    }
  };

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedDocumentIds(newSelectedIds);
  };

  // Defensive helpers
  const safe = (val: any, fallback: string = '') => (val === undefined || val === null ? fallback : val);

  // Helper to always return a string for folder name
  function getFolderName(folders: any[] | undefined, selectedFolder: string | null): string {
    if (!folders || !selectedFolder) return 'Folder';
    const folder = folders.find(f => f.id === selectedFolder);
    if (!folder) return 'Folder';
    return typeof folder.name === 'string' && folder.name.length > 0 ? folder.name : 'Folder';
  }

  // Add a stub for onCopyToFolder
  const handleCopyToFolder = async (documentId: string, targetFolderId: string | null) => {
    // TODO: implement copy logic
    toast({ title: 'Copy', description: `Copy document ${documentId} to folder ${targetFolderId}` });
  };

  // Add loading/empty state
  if (!folders || !documents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  const noContent = filteredFolders.length === 0 && filteredDocuments.length === 0;

  // UI
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {selectedFolder && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)} title="Go back">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          )}
          <h1 className="text-2xl font-bold">{selectedFolder ? getFolderName(folders, selectedFolder as string) : 'Document Repository'}</h1>
        </div>
        <div className="flex gap-2">
          {!isInTrash && (
            <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#8E1616] hover:bg-[#7A1414] text-white flex items-center gap-2">
              <Plus className="h-4 w-4" /> Upload
            </Button>
          )}
          <Button 
            variant={isInTrash ? 'default' : 'outline'} 
            onClick={() => setIsInTrash(!isInTrash)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isInTrash ? 'Exit Trash' : 'Trash'}
          </Button>
          <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('card')}><Grid className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-muted/50 rounded-lg p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => {
                  setSelectedFolder(null);
                  setIsInTrash(false);
                }} 
                className="cursor-pointer flex items-center gap-1"
              >
                <Home className="h-4 w-4" /> Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            {isInTrash && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" /> Trash
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {!isInTrash && breadcrumbPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbPath.length - 1 ? (
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink onClick={() => setSelectedFolder(folder.id)} className="cursor-pointer">{folder.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2 mb-4 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <SearchInput
          type="text"
          placeholder="Search documents and folders..."
          value={searchTerm || ''}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-input"
        />
      </div>

      {/* Bulk Actions */}
      {selectedDocumentIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedDocumentIds.length} document(s) selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDownload}
              className="text-blue-600 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggleImportant(true)}
              className="text-yellow-600 hover:bg-yellow-100"
            >
              <Star className="h-4 w-4 mr-1" />
              Mark Important
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggleImportant(false)}
              className="text-gray-600 hover:bg-gray-100"
            >
              <StarOff className="h-4 w-4 mr-1" />
              Unmark Important
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Folders and Files */}
      {isInTrash ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Recycle Bin
            </h2>
            <p className="text-sm text-muted-foreground">
              Items will be permanently deleted after 30 days
            </p>
          </div>
          <TrashFolder isOpen={true} onClose={() => setIsInTrash(false)} inline={true} />
        </div>
      ) : noContent ? (
        <div className="text-center text-muted-foreground py-12 text-lg">No documents or folders found.</div>
      ) : (
        <>
          <FolderSection
            folders={filteredFolders.map(f => ({...f, name: safe(f.name, 'Untitled'), id: safe(f.id, '')}))}
            userProfiles={userProfiles || {}}
            onFolderClick={setSelectedFolder}
            onDeleteFolder={handleDeleteFolder}
            canAccessLockedFolders={true}
            viewMode={viewMode}
          />
          <FileSection
            documents={filteredDocuments.map(d => ({...d, name: safe(d.name, 'Untitled'), id: safe(d.id, '')}))}
            userProfiles={userProfiles || {}}
            currentUserId={user?.id}
            canDeleteDocument={() => true}
            onViewDocument={setViewDocument}
            onDownloadDocument={() => {}}
            onToggleImportant={() => {}}
            onRenameDocument={setRenameDocument}
            onCopyDocument={() => {}}
            onDeleteDocument={handleDeleteDocument}
            onMoveDocument={handleMoveDocument}
            onCopyToFolder={handleCopyToFolder}
            onDragStart={() => {}}
            folders={folders}
            viewMode={viewMode}
            selectedIds={selectedDocumentIds}
            onSelectionChange={handleSelectionChange}
          />
        </>
      )}

      {/* Dialogs */}
      <DocumentUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={async (file, folder) => {
          try {
            await uploadDocument(file, folder || selectedFolder || undefined);
            setIsUploadDialogOpen(false);
            toast({ title: "Success", description: `Document "${file.name}" uploaded successfully` });
          } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to upload document", variant: "destructive" });
          }
        }}
        currentFolderId={selectedFolder}
      />
      <DocumentRenameDialog
        isOpen={!!renameDocument}
        document={renameDocument}
        onClose={() => setRenameDocument(null)}
        onRename={async (newName) => {
          try {
            await renameDocumentMutation.mutateAsync({ documentId: renameDocument?.id, newName });
            setRenameDocument(null);
            toast({ title: "Success", description: "Document renamed successfully" });
          } catch (error: any) {
            toast({ title: "Error", description: "Failed to rename document", variant: "destructive" });
          }
        }}
      />
      <TrashFolder isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
      <DocumentViewer isOpen={!!viewDocument} onClose={() => setViewDocument(null)} document={viewDocument} documentType="document" />
    </div>
  );
};
