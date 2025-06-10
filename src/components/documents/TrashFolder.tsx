
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FileText, RotateCcw, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useRecycleBin } from '@/hooks/useRecycleBin';

export const TrashFolder: React.FC = () => {
  const { 
    recycleBinItems, 
    loading, 
    restoreDocument, 
    permanentlyDeleteDocument, 
    cleanupExpiredItems,
    getDaysUntilPermanentDelete 
  } = useRecycleBin();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Trash</h3>
          <p className="text-sm text-muted-foreground">
            Deleted documents are kept here for 15 days • {recycleBinItems.length} items
          </p>
        </div>
        
        {recycleBinItems.length > 0 && (
          <Button 
            onClick={cleanupExpiredItems}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Empty Trash</span>
          </Button>
        )}
      </div>

      {/* Trash Table */}
      {recycleBinItems.length === 0 ? (
        <div className="bg-card rounded-lg border">
          <div className="text-center py-8">
            <Trash2 className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-medium text-muted-foreground mb-2">Trash is empty</h3>
            <p className="text-sm text-muted-foreground">
              Deleted documents will appear here and be automatically removed after 15 days
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recycleBinItems.map((item) => {
                const daysLeft = getDaysUntilPermanentDelete(item.permanent_delete_at);
                const isExpiringSoon = daysLeft <= 3;
                
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFileIcon(item.mime_type)}
                        {item.is_important && (
                          <span className="text-yellow-500 text-xs">★</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.folder || 'general'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {item.mime_type?.split('/')[1] || 'file'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(item.file_size)}</TableCell>
                    <TableCell>{formatDate(item.deleted_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {daysLeft} days
                        </span>
                        {isExpiringSoon && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={() => restoreDocument(item.id, item.name)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Permanently Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete "{item.name}"? This action cannot be undone and the document will be lost forever.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => permanentlyDeleteDocument(item.id, item.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
