
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
      name: 'Secretary',
      description: 'Administrative access and meeting management',
      permissions: ['Meeting Management', 'Document Management', 'User Management'],
      memberCount: members.filter(m => m.roles.includes('secretary')).length
    },
    {
      name: 'Treasurer',
      description: 'Financial management and reporting',
      permissions: ['Financial Reports', 'Budget Management', 'Expense Tracking'],
      memberCount: members.filter(m => m.roles.includes('treasurer')).length
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

  const handleMemberUpdated = async () => {
    console.log('Member updated, refreshing list...');
    await fetchMembers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 lg:p-6">
        {/* Header - Mobile optimized */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Member Management</h1>
            <p className="text-sm lg:text-base text-gray-600">Manage bureau members, roles, and permissions</p>
          </div>
          {userRole.canManageMembers && (
            <Button 
              className="w-full lg:w-auto bg-primary hover:bg-primary/90 h-12 lg:h-10"
              onClick={() => setShowAddMemberDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>

        {/* Tabs - Mobile optimized */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-12 lg:h-10">
            <TabsTrigger value="members" className="text-sm lg:text-base">
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-sm lg:text-base">
              Roles & Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Search and Actions - Mobile optimized */}
            <div className="space-y-3 lg:space-y-0 lg:flex lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 lg:h-10 text-base lg:text-sm"
                  />
                </div>
              </div>
              {userRole.canManageMembers && (
                <Button 
                  variant="outline" 
                  onClick={handleExportMembers}
                  className="w-full lg:w-auto h-12 lg:h-10 text-base lg:text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export List
                </Button>
              )}
            </div>

            {/* Members Grid - Mobile optimized */}
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  onRoleChange={(memberId, newRole) => {
                    updateMemberRole(memberId, newRole);
                  }}
                  onDeleteMember={(memberId) => {
                    deleteMember(memberId);
                  }}
                  onSuspendMember={(memberId, suspend) => {
                    if (suspendMember) {
                      suspendMember(memberId, suspend);
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

            {/* Empty State - Mobile optimized */}
            {filteredMembers.length === 0 && (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No members found' : 'No members yet'}
                </h3>
                <p className="text-gray-500 mb-6 text-sm lg:text-base">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first member'
                  }
                </p>
                {!searchTerm && userRole.canManageMembers && (
                  <Button 
                    onClick={() => setShowAddMemberDialog(true)}
                    className="w-full lg:w-auto h-12 lg:h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            {/* Roles Grid - Mobile optimized */}
            <div className="space-y-4">
              {roles.map((role, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="space-y-3 lg:space-y-0 lg:flex lg:justify-between lg:items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg lg:text-xl">{role.name}</CardTitle>
                        <CardDescription className="text-sm lg:text-base">{role.description}</CardDescription>
                      </div>
                      <Badge className="bg-primary text-white text-sm self-start">
                        {role.memberCount} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm lg:text-base flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Permissions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs lg:text-sm">
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
          onMemberAdded={() => {
            setShowAddMemberDialog(false);
            fetchMembers(); // Refresh the members list
          }}
        />
      )}
    </>
  );
};
