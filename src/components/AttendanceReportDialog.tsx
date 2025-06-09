
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const AttendanceReportDialog: React.FC<AttendanceReportDialogProps> = ({ 
  open, 
  onOpenChange, 
  meeting 
}) => {
  if (!meeting) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Attendance Report</span>
          </DialogTitle>
          <DialogDescription>
            View attendance statistics for this meeting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{meeting.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">Present</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <div className="text-sm text-muted-foreground">Absent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-sm text-muted-foreground">Late</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Attendance Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance data available</p>
                <p className="text-sm">Members need to check-in to record attendance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
