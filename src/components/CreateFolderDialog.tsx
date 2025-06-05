
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateFolderDialogProps {
  onFolderCreated: (folderName: string) => void;
  existingFolders: string[];
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ 
  onFolderCreated, 
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

    await onFolderCreated(normalizedFolderName);
    setFolderName('');
    setOpen(false);
  };

  return (
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
      </DialogContent>
    </Dialog>
  );
};
