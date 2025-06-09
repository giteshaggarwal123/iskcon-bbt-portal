
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Settings, MessageCircle, Trash2, Lock, UserX, RotateCcw, Activity, Edit3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberSettingsDialog } from './MemberSettingsDialog';
import { MemberMessageDialog } from './MemberMessageDialog';
import { MemberActivityDialog } from './MemberActivityDialog';
import { MemberEditDialog } from './MemberEditDialog';
import { useUserRole } from '@/hooks/useUserRole';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  roles: string[];
  is_suspended?: boolean;
}

interface MemberCardProps {
  member: Member;
  onRoleChange: (memberId: string, newRole: string) => void;
  onDeleteMember: (memberId: string) => void;
  onSuspendMember?: (memberId: string, suspend: boolean) => void;
  onResetPassword?: (memberId: string) => void;
  onMemberUpdated?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  onRoleChange, 
  onDeleteMember, 
  onSuspendMember,
  onResetPassword,
  onMemberUpdated 
}) => {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const userRole = useUserRole();

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'super_admin': 'bg-red-500 text-white',
      'admin': 'bg-blue-500 text-white',
      'secretary': 'bg-green-500 text-white',
      'treasurer': 'bg-yellow-500 text-white',
      'member': 'bg-gray-500 text-white'
    };
    return <Badge className={roleColors[role] || 'bg-gray-500 text-white'}>
      {role === 'super_admin' ? 'Super Admin' : role.replace('_', ' ')}
    </Badge>;
  };

  // For super admin detection, check email first
  const actualRole = member.email === 'cs@iskconbureau.in' ? 'super_admin' : (member.roles[0] || 'member');
  const joinDate = new Date(member.created_at).toLocaleDateString();

  const handleDeleteMember = () => {
    onDeleteMember(member.id);
  };

  const handleSuspendMember = () => {
    if (onSuspendMember) {
      onSuspendMember(member.id, !member.is_suspended);
    }
  };

  const handleResetPassword = () => {
    if (onResetPassword) {
      onResetPassword(member.id);
    }
  };

  const handleMemberUpdated = () => {
    if (onMemberUpdated) {
      onMemberUpdated();
    }
  };

  // Role change permissions - enhanced with more granular control
  const canChangeRole = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin' && actualRole !== 'admin');
  const canDeleteMember = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin' && actualRole !== 'admin');
  const canViewSettings = userRole.isSuperAdmin || userRole.isAdmin || userRole.isSecretary;
  const canSendMessage = true; // All users can send messages
  const canSuspendMember = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin' && actualRole !== 'admin');
  const canResetPassword = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin');
  const canViewActivity = userRole.isSuperAdmin || userRole.isAdmin;
  const canEditMember = userRole.isSuperAdmin; // Only super admin can edit member info
  
  // Super admin can never be deleted or have role changed by others
  const isSuperAdminMember = actualRole === 'super_admin';
  const isProtectedMember = isSuperAdminMember || (actualRole === 'admin' && !userRole.isSuperAdmin);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            {/* Avatar and Basic Info */}
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                  {member.first_name} {member.last_name}
                </h3>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center space-x-1 text-xs lg:text-sm text-gray-500">
                    <Mail className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center space-x-1 text-xs lg:text-sm text-gray-500">
                      <Phone className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
                
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {getRoleBadge(actualRole)}
                  <Badge variant="outline" className="text-xs">
                    Joined {joinDate}
                  </Badge>
                  {isSuperAdminMember && (
                    <Badge className="bg-amber-500 text-white text-xs">
                      System Admin
                    </Badge>
                  )}
                  {member.is_suspended && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      <UserX className="h-3 w-3 mr-1" />
                      Suspended
                    </Badge>
                  )}
                  {isProtectedMember && (
                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Role Selection and Actions */}
            <div className="flex flex-col space-y-3 lg:items-end lg:justify-start lg:min-w-0 lg:w-auto">
              {/* Role Selector */}
              <div className="w-full lg:w-40">
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <Select 
                  value={actualRole} 
                  onValueChange={(value) => onRoleChange(member.id, value)}
                  disabled={!canChangeRole || isProtectedMember}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole.isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                    {userRole.isSuperAdmin && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                {!canChangeRole && (
                  <p className="text-xs text-gray-500 mt-1">
                    {isProtectedMember ? 'Protected role' : 'No permission'}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 w-full lg:justify-end">
                {canEditMember && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="text-blue-600 hover:text-blue-700 h-8 px-3 text-xs lg:text-sm"
                  >
                    <Edit3 className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                )}

                {canViewSettings && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs lg:text-sm">
                        <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Member Settings
                      </DropdownMenuItem>
                      
                      {canViewActivity && (
                        <DropdownMenuItem onClick={() => setShowActivityDialog(true)}>
                          <Activity className="h-4 w-4 mr-2" />
                          View Activity
                        </DropdownMenuItem>
                      )}
                      
                      {canResetPassword && (
                        <DropdownMenuItem onClick={handleResetPassword}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {canSuspendMember && !isProtectedMember && (
                        <DropdownMenuItem onClick={handleSuspendMember}>
                          <UserX className="h-4 w-4 mr-2" />
                          {member.is_suspended ? 'Unsuspend' : 'Suspend'} Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {canSendMessage && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMessageDialog(true)}
                    className="h-8 px-3 text-xs lg:text-sm"
                  >
                    <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                )}

                {canDeleteMember && !isProtectedMember && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 h-8 px-3 text-xs lg:text-sm">
                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {member.first_name} {member.last_name}? 
                          This action cannot be undone and will permanently remove their account and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteMember}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Member
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {canEditMember && (
        <MemberEditDialog 
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          member={member}
          onMemberUpdated={handleMemberUpdated}
        />
      )}

      {canViewSettings && (
        <MemberSettingsDialog 
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          member={member}
        />
      )}

      {canSendMessage && (
        <MemberMessageDialog 
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          member={member}
        />
      )}

      {canViewActivity && (
        <MemberActivityDialog 
          open={showActivityDialog}
          onOpenChange={setShowActivityDialog}
          member={member}
        />
      )}
    </>
  );
};
