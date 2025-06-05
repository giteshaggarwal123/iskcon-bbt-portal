
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Folder, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateFolderDialogProps {
  onFolderCreated: (folderName: string) => void;
  onFolderDeleted: (folderName: string) => void;
  existingFolders: string[];
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ 
  onFolderCreated,
  onFolderDeleted,
  existingFolders 
}) => {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Invalid Folder Name",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }

    const normalizedFolderName = folderName.toLowerCase().trim();
    if (existingFolders.map(f => f.toLowerCase()).includes(normalizedFolderName)) {
      toast({
        title: "Folder Exists",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      await onFolderCreated(normalizedFolderName);
      setFolderName('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    try {
      await onFolderDeleted(folderName);
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={open} onOpenChange={setOpen}>
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
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                <Folder className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          </div>
          
          {existingFolders.length > 0 && (
            <div className="mt-6">
              <Label>Existing Folders</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {existingFolders.filter(folder => folder !== 'general').map((folder) => (
                  <div key={folder} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm capitalize">{folder}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the folder "{folder}" and all its contents? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteFolder(folder)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Folder
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
