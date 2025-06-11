
import React from 'react';
import { FolderOpen, Lock, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  is_locked: boolean;
}

interface FolderSectionProps {
  folders: Folder[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  onFolderClick: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
  canAccessLockedFolders?: boolean;
}

export const FolderSection: React.FC<FolderSectionProps> = ({
  folders,
  userProfiles,
  onFolderClick,
  onDeleteFolder,
  canAccessLockedFolders = false
}) => {
  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown User';
  };

  const handleDeleteFolderAction = async (folderId: string, folderName: string) => {
    const success = await onDeleteFolder(folderId);
    if (success) {
      // Handle success if needed
    }
  };

  if (folders.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
        <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
        Folders ({folders.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {folders.map((folder) => (
          <div
            key={`folder-${folder.id}`}
            className="bg-card border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={() => onFolderClick(folder.id)}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {folder.is_locked ? (
                  <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
                ) : (
                  <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0" />
                )}
                <span className={`font-medium truncate text-sm sm:text-base ${folder.is_locked ? 'text-red-700' : ''}`}>
                  {folder.name}
                </span>
              </div>
              {canAccessLockedFolders && (
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteFolderAction(folder.id, folder.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            
            {folder.is_locked && (
              <Badge variant="destructive" className="text-xs mb-2">
                LOCKED
              </Badge>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Modified: {format(new Date(folder.updated_at), 'MMM dd, yyyy')}</div>
              <div className="truncate">Created by: {getUserDisplayName(folder.created_by)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
