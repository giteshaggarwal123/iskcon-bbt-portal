
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Folder, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/use-toast';

interface FolderManagementProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

export const FolderManagement: React.FC<FolderManagementProps> = ({
  onFolderSelect,
  selectedFolderId
}) => {
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Invalid Folder Name",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate names
    const existingFolder = folders.find(
      folder => folder.name.toLowerCase() === newFolderName.toLowerCase().trim()
    );

    if (existingFolder) {
      toast({
        title: "Folder Exists",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }

    const result = await createFolder(newFolderName);
    if (result) {
      setNewFolderName('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditFolder = async () => {
    if (!editFolderName.trim() || !editingFolder) return;

    // Check for duplicate names (excluding current folder)
    const existingFolder = folders.find(
      folder => 
        folder.id !== editingFolder.id && 
        folder.name.toLowerCase() === editFolderName.toLowerCase().trim()
    );

    if (existingFolder) {
      toast({
        title: "Folder Exists",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }

    await updateFolder(editingFolder.id, { name: editFolderName.trim() });
    setEditingFolder(null);
    setEditFolderName('');
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (folder: any) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Folders</h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  <Folder className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {/* General folder (default) */}
        <div 
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
            selectedFolderId === null ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          onClick={() => onFolderSelect?.(null)}
        >
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4 text-gray-600" />
            <span className="text-sm">General</span>
          </div>
        </div>

        {/* Custom folders */}
        {folders.map((folder) => (
          <div 
            key={folder.id}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
              selectedFolderId === folder.id ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => onFolderSelect?.(folder.id)}
          >
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{folder.name}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                      <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{folder.name}"? This action cannot be undone.
                        All documents must be moved from this folder before deletion.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteFolder(folder.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFolderName">Folder Name</Label>
              <Input
                id="editFolderName"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditFolder();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditFolder}>
                <Folder className="h-4 w-4 mr-2" />
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
