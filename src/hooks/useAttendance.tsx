
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AttendanceRecord {
  id: string;
  meeting_id: string;
  user_id: string;
  join_time: string | null;
  leave_time: string | null;
  duration_minutes: number | null;
  attendance_status: 'present' | 'late' | 'absent' | 'left_early';
  attendance_type: 'physical' | 'online';
  is_verified: boolean | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles!attendance_records_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(record => ({
        ...record,
        attendance_status: record.attendance_status as 'present' | 'late' | 'absent' | 'left_early',
        attendance_type: record.attendance_type as 'physical' | 'online',
        profiles: record.profiles || { first_name: '', last_name: '', email: '' }
      }));

      setAttendanceRecords(transformedData);
    } catch (error: any) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForMeeting = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles!attendance_records_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('meeting_id', meetingId);

      if (error) throw error;

      return (data || []).map(record => ({
        ...record,
        attendance_status: record.attendance_status as 'present' | 'late' | 'absent' | 'left_early',
        attendance_type: record.attendance_type as 'physical' | 'online',
        profiles: record.profiles || { first_name: '', last_name: '', email: '' }
      }));
    } catch (error: any) {
      console.error('Error fetching meeting attendance:', error);
      return [];
    }
  };

  const markAttendance = async (
    meetingId: string,
    userId: string,
    status: 'present' | 'late' | 'absent' | 'left_early',
    type: 'physical' | 'online',
    joinTime?: string,
    leaveTime?: string,
    notes?: string
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to mark attendance",
        variant: "destructive"
      });
      return;
    }

    try {
      const attendanceData = {
        meeting_id: meetingId,
        user_id: userId,
        attendance_status: status,
        attendance_type: type,
        join_time: joinTime || null,
        leave_time: leaveTime || null,
        notes: notes || null,
        is_verified: false
      };

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(attendanceData)
        .select(`
          *,
          profiles!attendance_records_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance marked successfully"
      });

      fetchAttendanceRecords();
      return data;
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive"
      });
    }
  };

  // New function for simplified attendance marking with object parameter
  const markAttendanceSimple = async (params: {
    meetingId: string;
    userId: string;
    status: 'present' | 'late' | 'absent' | 'left_early';
    type: 'physical' | 'online';
    joinTime?: Date;
    leaveTime?: Date;
    notes?: string;
  }) => {
    return markAttendance(
      params.meetingId,
      params.userId,
      params.status,
      params.type,
      params.joinTime?.toISOString(),
      params.leaveTime?.toISOString(),
      params.notes
    );
  };

  const updateAttendance = async (
    recordId: string,
    updates: Partial<AttendanceRecord>
  ) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update(updates)
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance updated successfully"
      });

      fetchAttendanceRecords();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive"
      });
    }
  };

  const deleteAttendance = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance record deleted successfully"
      });

      fetchAttendanceRecords();
    } catch (error: any) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete attendance record",
        variant: "destructive"
      });
    }
  };

  const generateAttendanceReport = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles!attendance_records_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          meetings (
            title,
            start_time,
            meeting_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error generating attendance report:', error);
      return [];
    }
  };

  const autoTrackOnlineAttendance = async (meetingId: string, teamsData: any) => {
    try {
      if (!teamsData.attendees) return;

      const attendancePromises = teamsData.attendees.map(async (attendee: any) => {
        // Check if attendance already exists
        const { data: existing } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('meeting_id', meetingId)
          .eq('user_id', attendee.id)
          .single();

        if (existing) return;

        // Auto-mark attendance based on Teams data
        return markAttendance(
          meetingId,
          attendee.id,
          'present',
          'online',
          attendee.joinTime,
          attendee.leaveTime,
          `Auto-tracked from Teams meeting`
        );
      });

      await Promise.all(attendancePromises);
    } catch (error: any) {
      console.error('Error auto-tracking attendance:', error);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  return {
    attendanceRecords,
    loading,
    markAttendance: markAttendanceSimple,
    updateAttendance,
    deleteAttendance,
    fetchAttendanceRecords,
    fetchAttendanceForMeeting,
    generateAttendanceReport,
    autoTrackOnlineAttendance
  };
};
