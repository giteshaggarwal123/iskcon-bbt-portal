
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Settings, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onRoleChange }) => {
  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'admin': 'bg-red-500 text-white',
      'secretary': 'bg-blue-500 text-white',
      'treasurer': 'bg-green-500 text-white',
      'member': 'bg-gray-500 text-white'
    };
    return <Badge className={roleColors[role] || 'bg-gray-500 text-white'}>{role}</Badge>;
  };

  const primaryRole = member.roles[0] || 'member';
  const joinDate = new Date(member.created_at).toLocaleDateString();

  return (
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
                {getRoleBadge(primaryRole)}
                <Badge variant="outline">Joined {joinDate}</Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-3">
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <Select value={primaryRole} onValueChange={(value) => onRoleChange(member.id, value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="treasurer">Treasurer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
