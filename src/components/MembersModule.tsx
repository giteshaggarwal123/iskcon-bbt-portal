import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Mail, Phone, Shield, Settings, Search, Plus, Activity } from 'lucide-react';
import { AddMemberDialog } from './AddMemberDialog';

export const MembersModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  const members = [
    {
      id: 1,
      name: 'Radha Krishna Das',
      email: 'radha.krishna@iskcon.org',
      phone: '+91 98765 43210',
      role: 'General Secretary',
      permissions: ['Super Admin'],
      joinDate: '2020-01-15',
      lastActive: '2024-01-18 3:45 PM',
      status: 'active',
      profileImage: null,
      meetingsAttended: 45,
      documentsAccessed: 120
    },
    {
      id: 2,
      name: 'Govinda Maharaj',
      email: 'govinda@iskcon.org',
      phone: '+91 98765 43211',
      role: 'Bureau Member',
      permissions: ['Meeting Access', 'Document View'],
      joinDate: '2020-03-22',
      lastActive: '2024-01-18 2:30 PM',
      status: 'active',
      profileImage: null,
      meetingsAttended: 42,
      documentsAccessed: 89
    },
    {
      id: 3,
      name: 'Gauranga Prabhu',
      email: 'gauranga@iskcon.org',
      phone: '+91 98765 43212',
      role: 'Bureau Member',
      permissions: ['Meeting Access', 'Document View'],
      joinDate: '2021-06-10',
      lastActive: '2024-01-17 5:20 PM',
      status: 'active',
      profileImage: null,
      meetingsAttended: 38,
      documentsAccessed: 67
    },
    {
      id: 4,
      name: 'Nitai Das',
      email: 'nitai@iskcon.org',
      phone: '+91 98765 43213',
      role: 'Bureau Member',
      permissions: ['Meeting Access'],
      joinDate: '2022-02-18',
      lastActive: '2024-01-16 11:10 AM',
      status: 'inactive',
      profileImage: null,
      meetingsAttended: 25,
      documentsAccessed: 34
    }
  ];

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access and administration',
      permissions: ['All Permissions'],
      memberCount: 1
    },
    {
      name: 'General Secretary',
      description: 'Administrative access and meeting management',
      permissions: ['Meeting Management', 'Document Management', 'User Management'],
      memberCount: 1
    },
    {
      name: 'Bureau Member',
      description: 'Standard member access',
      permissions: ['Meeting Access', 'Document View', 'Voting'],
      memberCount: 10
    }
  ];

  const activityLogs = [
    { user: 'Radha Krishna Das', action: 'Created new meeting', timestamp: '2024-01-18 3:45 PM' },
    { user: 'Govinda Maharaj', action: 'Voted on Temple Expansion', timestamp: '2024-01-18 2:30 PM' },
    { user: 'Gauranga Prabhu', action: 'Downloaded Financial Report', timestamp: '2024-01-17 5:20 PM' }
  ];

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-success text-white">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'General Secretary': 'bg-primary text-white',
      'Bureau Member': 'bg-secondary text-gray-800',
      'Super Admin': 'bg-error text-white'
    };
    return <Badge className={roleColors[role] || 'bg-gray-500 text-white'}>{role}</Badge>;
  };

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
            <TabsTrigger value="members">Members</TabsTrigger>
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
                    placeholder="Search members by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </div>

            <div className="grid gap-6">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{member.email}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {getRoleBadge(member.role)}
                            {getStatusBadge(member.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-primary">{member.meetingsAttended}</div>
                            <div className="text-xs text-gray-500">Meetings</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">{member.documentsAccessed}</div>
                            <div className="text-xs text-gray-500">Documents</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last active: {member.lastActive}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  {activityLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{log.user}</p>
                          <p className="text-sm text-gray-500">{log.action}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{log.timestamp}</div>
                    </div>
                  ))}
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
                      <span className="text-gray-500">Bureau Member</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Require admin approval</span>
                      <span className="text-gray-500">Yes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Auto-deactivate inactive members</span>
                      <span className="text-gray-500">90 days</span>
                    </div>
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
      />
    </>
  );
};
