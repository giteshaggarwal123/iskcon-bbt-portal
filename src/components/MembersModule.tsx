
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Mail, Phone, Shield, Search, Plus, Download } from 'lucide-react';
import { AddMemberDialog } from './AddMemberDialog';
import { MemberCard } from './MemberCard';
import { useMembers } from '@/hooks/useMembers';
import { useUserRole } from '@/hooks/useUserRole';

export const MembersModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const { 
    members, 
    loading, 
    addMember, 
    updateMemberRole, 
    deleteMember, 
    suspendMember,
    resetPassword,
    searchMembers,
    fetchMembers
  } = useMembers();
  const userRole = useUserRole();

  // Use the search function from the hook
  const filteredMembers = useMemo(() => {
    return searchMembers(searchTerm);
  }, [members, searchTerm, searchMembers]);

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access and super administration',
      permissions: ['All Permissions', 'Manage Super Admins'],
      memberCount: members.filter(m => m.roles.includes('super_admin')).length
    },
    {
      name: 'Admin',
      description: 'Full system access and administration',
      permissions: ['All Permissions except Super Admin Management'],
      memberCount: members.filter(m => m.roles.includes('admin')).length
    },
    {
      name: 'Member',
      description: 'Standard member access',
      permissions: ['Meeting Access', 'Document View', 'Voting'],
      memberCount: members.filter(m => m.roles.includes('member') || m.roles.length === 0).length
    }
  ];

  const handleExportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Join Date'],
      ...members.map(member => [
        `${member.first_name} ${member.last_name}`,
        member.email,
        member.phone || '',
        member.roles[0] || 'member',
        new Date(member.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Enhanced member update handler with immediate refresh
  const handleMemberUpdated = async () => {
    console.log('Member updated - triggering immediate data refresh');
    try {
      await fetchMembers();
      console.log('Member data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing member data:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-0 flex flex-col">
      {/* Header Section - Mobile Optimized */}
      <div className="w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 truncate">
              Member Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage bureau members, roles, and permissions
            </p>
          </div>
          {userRole.canManageMembers && (
            <div className="flex-shrink-0">
              <Button 
                className="w-full sm:w-auto h-10 sm:h-auto"
                onClick={() => setShowAddMemberDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Add Member</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section - Mobile Optimized */}
      <div className="w-full flex-1 min-h-0">
        <Tabs defaultValue="members" className="w-full h-full flex flex-col">
          <div className="w-full mb-6">
            <TabsList className="w-full grid grid-cols-2 h-10">
              <TabsTrigger value="members" className="text-xs sm:text-sm truncate">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="roles" className="text-xs sm:text-sm truncate">
                Roles & Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Members Tab */}
          <TabsContent value="members" className="w-full flex-1 min-h-0 mt-0">
            {/* Search and Export Section */}
            <div className="w-full mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Search members by name, email, phone, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>
                {userRole.canManageMembers && (
                  <div className="flex-shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={handleExportMembers}
                      className="w-full sm:w-auto h-10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="whitespace-nowrap">Export List</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="w-full">
              {filteredMembers.length === 0 ? (
                <Card className="w-full">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {searchTerm ? 'No members found' : 'No members yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search criteria'
                        : 'Get started by adding your first member'
                      }
                    </p>
                    {!searchTerm && userRole.canManageMembers && (
                      <Button onClick={() => setShowAddMemberDialog(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="w-full space-y-4 sm:space-y-6">
                  {filteredMembers.map((member) => (
                    <MemberCard 
                      key={member.id} 
                      member={member} 
                      onRoleChange={async (memberId, newRole) => {
                        await updateMemberRole(memberId, newRole);
                        await handleMemberUpdated();
                      }}
                      onDeleteMember={async (memberId) => {
                        await deleteMember(memberId);
                        await handleMemberUpdated();
                      }}
                      onSuspendMember={async (memberId, suspend) => {
                        if (suspendMember) {
                          await suspendMember(memberId, suspend);
                          await handleMemberUpdated();
                        }
                      }}
                      onResetPassword={(memberId) => {
                        if (resetPassword) {
                          resetPassword(memberId);
                        }
                      }}
                      onMemberUpdated={handleMemberUpdated}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="w-full flex-1 min-h-0 mt-0">
            <div className="w-full space-y-4 sm:space-y-6">
              {roles.map((role, index) => (
                <Card key={index} className="w-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg sm:text-xl mb-2 leading-tight">
                          {role.name}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {role.description}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {role.memberCount} member{role.memberCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center text-sm">
                        <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                        Permissions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {userRole.canManageMembers && (
        <AddMemberDialog 
          open={showAddMemberDialog} 
          onOpenChange={setShowAddMemberDialog}
          onMemberAdded={async () => {
            setShowAddMemberDialog(false);
            // Force immediate refresh
            await handleMemberUpdated();
          }}
        />
      )}
    </div>
  );
};
