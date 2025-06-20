
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'super_admin': 'bg-red-500 text-white',
      'admin': 'bg-blue-500 text-white',
      'member': 'bg-gray-500 text-white'
    };
    return <Badge className={roleColors[role] || 'bg-gray-500 text-white'}>
      {role === 'super_admin' ? 'Super Admin' : role.replace('_', ' ')}
    </Badge>;
  };

  // Fixed role detection logic - only cs@iskconbureau.in can be super admin
  const getActualRole = (memberEmail: string, memberRoles: string[]): string => {
    if (memberEmail === 'cs@iskconbureau.in') {
      return 'super_admin';
    }
    
    const rawRole = memberRoles[0] || 'member';
    // Convert legacy roles to member and prevent incorrect super admin assignment
    if (rawRole === 'secretary' || rawRole === 'treasurer' || rawRole === 'super_admin') {
      return 'member';
    }
    
    return rawRole;
  };

  const actualRole = getActualRole(member.email, member.roles);
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

  // Enhanced permission logic with proper super admin protection
  const canChangeRole = userRole.isSuperAdmin && member.email !== 'cs@iskconbureau.in';
  const canDeleteMember = userRole.isSuperAdmin && member.email !== 'cs@iskconbureau.in';
  const canViewSettings = true;
  const canSendMessage = true;
  const canSuspendMember = false;
  const canResetPassword = userRole.isSuperAdmin && member.email !== 'cs@iskconbureau.in';
  const canViewActivity = true;
  const canEditMember = userRole.isSuperAdmin;
  
  // Super admin protection
  const isSuperAdminMember = member.email === 'cs@iskconbureau.in';
  const isProtectedMember = isSuperAdminMember;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-center justify-between'}`}>
            <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center space-x-4'}`}>
              <div className={`${isMobile ? 'flex items-center space-x-3' : 'flex items-center space-x-4'}`}>
                <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <User className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 truncate`}>
                    {member.first_name} {member.last_name}
                  </h3>
                  <div className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center space-x-4'} ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                    <span className="flex items-center space-x-1 min-w-0">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </span>
                    {member.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {getRoleBadge(actualRole)}
                <Badge variant="outline" className={`${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Joined {joinDate}
                </Badge>
                {isSuperAdminMember && (
                  <Badge className="bg-gold-500 text-white text-xs">System Admin</Badge>
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
            
            <div className={`${isMobile ? 'flex flex-col space-y-3 w-full' : 'text-right space-y-3'}`}>
              <div className={`${isMobile ? 'w-full' : ''}`}>
                <label className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 block mb-1`}>Role</label>
                <Select 
                  value={actualRole} 
                  onValueChange={(value) => onRoleChange(member.id, value)}
                  disabled={!canChangeRole || isProtectedMember}
                >
                  <SelectTrigger className={`${isMobile ? 'w-full h-8' : 'w-32'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole.isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                {!canChangeRole && (
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                    {isProtectedMember ? 'Protected role' : 'No permission'}
                  </p>
                )}
              </div>
              
              <div className={`${isMobile ? 'flex justify-center space-x-2 pt-2 border-t border-gray-100' : 'flex space-x-2'}`}>
                {canEditMember && (
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "sm"}
                    onClick={() => setShowEditDialog(true)}
                    className={`text-blue-600 hover:text-blue-700 ${isMobile ? 'h-8 w-8 p-0' : ''}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}

                {canViewSettings && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"}
                        className={`${isMobile ? 'h-8 w-8 p-0' : ''}`}
                      >
                        <Settings className="h-4 w-4" />
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
                    size={isMobile ? "sm" : "sm"}
                    onClick={() => setShowMessageDialog(true)}
                    className={`${isMobile ? 'h-8 w-8 p-0' : ''}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}

                {canDeleteMember && !isProtectedMember && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"}
                        className={`text-red-600 hover:text-red-700 ${isMobile ? 'h-8 w-8 p-0' : ''}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
