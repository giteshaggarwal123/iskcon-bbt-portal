
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Settings, MessageCircle, Trash2, Lock } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberSettingsDialog } from './MemberSettingsDialog';
import { MemberMessageDialog } from './MemberMessageDialog';
import { useUserRole } from '@/hooks/useUserRole';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  roles: string[];
}

interface MemberCardProps {
  member: Member;
  onRoleChange: (memberId: string, newRole: string) => void;
  onDeleteMember: (memberId: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onRoleChange, onDeleteMember }) => {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
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

  // Role change permissions - enhanced with more granular control
  const canChangeRole = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin' && actualRole !== 'admin');
  const canDeleteMember = userRole.isSuperAdmin || (userRole.isAdmin && actualRole !== 'super_admin' && actualRole !== 'admin');
  const canViewSettings = userRole.isSuperAdmin || userRole.isAdmin || userRole.isSecretary;
  const canSendMessage = true; // All users can send messages
  
  // Super admin can never be deleted or have role changed by others
  const isSuperAdminMember = actualRole === 'super_admin';
  const isProtectedMember = isSuperAdminMember || (actualRole === 'admin' && !userRole.isSuperAdmin);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.first_name} {member.last_name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </span>
                  {member.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleBadge(actualRole)}
                  <Badge variant="outline">Joined {joinDate}</Badge>
                  {isSuperAdminMember && (
                    <Badge className="bg-gold-500 text-white">System Admin</Badge>
                  )}
                  {isProtectedMember && (
                    <Badge className="bg-amber-100 text-amber-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-3">
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <Select 
                  value={actualRole} 
                  onValueChange={(value) => onRoleChange(member.id, value)}
                  disabled={!canChangeRole || isProtectedMember}
                >
                  <SelectTrigger className="w-32">
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
              
              <div className="flex space-x-2">
                {canViewSettings && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                        Member Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        View Activity
                      </DropdownMenuItem>
                      {!isSuperAdminMember && userRole.isSuperAdmin && (
                        <DropdownMenuItem>
                          Reset Password
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
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}

                {canDeleteMember && !isProtectedMember && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
    </>
  );
};
