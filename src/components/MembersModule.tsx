import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Mail, Phone, Shield, Settings, Search, Plus, Activity, Download } from 'lucide-react';
import { AddMemberDialog } from './AddMemberDialog';
import { MemberCard } from './MemberCard';
import { useMembers } from '@/hooks/useMembers';

export const MembersModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const { members, activityLogs, loading, addMember, updateMemberRole, deleteMember, searchMembers } = useMembers();

  // Use the search function from the hook
  const filteredMembers = useMemo(() => {
    return searchMembers(searchTerm);
  }, [members, searchTerm, searchMembers]);

  const roles = [
    {
      name: 'Admin',
      description: 'Full system access and administration',
      permissions: ['All Permissions'],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
            <p className="text-gray-600">Manage bureau members, roles, and permissions</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowAddMemberDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members by name, email, phone, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleExportMembers}>
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </div>

            <div className="grid gap-6">
              {filteredMembers.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  onRoleChange={updateMemberRole}
                  onDeleteMember={deleteMember}
                />
              ))}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No members found' : 'No members yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first member'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowAddMemberDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="grid gap-6">
              {roles.map((role, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{role.name}</CardTitle>
                        <CardDescription className="mt-2">{role.description}</CardDescription>
                      </div>
                      <Badge className="bg-primary text-white">{role.memberCount} members</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Permissions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((permission, idx) => (
                            <Badge key={idx} variant="secondary">{permission}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button variant="outline" size="sm">Edit Permissions</Button>
                        <Button variant="outline" size="sm">Manage Members</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Track member actions and system usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{log.user_name}</p>
                            <p className="text-sm text-gray-500">{log.action}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No activity logs yet. Member actions will appear here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Management Settings</CardTitle>
                <CardDescription>Configure member access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Default Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>New member default role</span>
                      <Badge variant="outline">Member</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Require admin approval</span>
                      <Badge variant="outline">Yes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Auto-deactivate inactive members</span>
                      <Badge variant="outline">90 days</Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">Update Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddMemberDialog 
        open={showAddMemberDialog} 
        onOpenChange={setShowAddMemberDialog}
        onMemberAdded={() => {
          setShowAddMemberDialog(false);
        }}
      />
    </>
  );
};
