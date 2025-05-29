
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, Clock, Users, MapPin } from 'lucide-react';

interface MarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarkAttendanceDialog: React.FC<MarkAttendanceDialogProps> = ({ open, onOpenChange }) => {
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'late' | 'absent'>>({});

  const members = [
    { id: '1', name: 'Radha Krishna Das', role: 'General Secretary', status: 'present' },
    { id: '2', name: 'Govinda Maharaj', role: 'Bureau Member', status: '' },
    { id: '3', name: 'Gauranga Prabhu', role: 'Bureau Member', status: 'late' },
    { id: '4', name: 'Nitai Das', role: 'Bureau Member', status: '' }
  ];

  const meeting = {
    title: 'Monthly Bureau Meeting',
    date: '2024-01-20',
    time: '10:00 AM',
    location: 'Main Conference Room'
  };

  const handleAttendanceChange = (memberId: string, status: 'present' | 'late' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSubmit = () => {
    console.log('Attendance marked:', attendance);
    // Save attendance logic here
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-white">Present</Badge>;
      case 'late':
        return <Badge className="bg-warning text-white">Late</Badge>;
      case 'absent':
        return <Badge className="bg-error text-white">Absent</Badge>;
      default:
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Mark Attendance</span>
          </DialogTitle>
          <DialogDescription className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{meeting.date} at {meeting.time}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{meeting.title}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">
                  {members.filter(m => m.status === 'present' || attendance[m.id] === 'present').length}
                </div>
                <div className="text-sm text-gray-500">Present</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {members.filter(m => m.status === 'late' || attendance[m.id] === 'late').length}
                </div>
                <div className="text-sm text-gray-500">Late</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-error">
                  {members.filter(m => attendance[m.id] === 'absent').length}
                </div>
                <div className="text-sm text-gray-500">Absent</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {members.map((member) => {
              const currentStatus = attendance[member.id] || member.status;
              return (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(currentStatus)}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={currentStatus === 'present' ? 'default' : 'outline'}
                        className={currentStatus === 'present' ? 'bg-success hover:bg-success/90' : ''}
                        onClick={() => handleAttendanceChange(member.id, 'present')}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={currentStatus === 'late' ? 'default' : 'outline'}
                        className={currentStatus === 'late' ? 'bg-warning hover:bg-warning/90' : ''}
                        onClick={() => handleAttendanceChange(member.id, 'late')}
                      >
                        Late
                      </Button>
                      <Button
                        size="sm"
                        variant={currentStatus === 'absent' ? 'default' : 'outline'}
                        className={currentStatus === 'absent' ? 'bg-error hover:bg-error/90' : ''}
                        onClick={() => handleAttendanceChange(member.id, 'absent')}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              <UserCheck className="h-4 w-4 mr-2" />
              Save Attendance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
