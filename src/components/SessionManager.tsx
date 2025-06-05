
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, Globe, Clock, Trash2 } from 'lucide-react';
import { useSessionManager } from '@/hooks/useSessionManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Session {
  id: string;
  session_id: string;
  device_info: any;
  user_agent: string;
  last_active: string;
  created_at: string;
  expires_at: string;
}

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { getActiveSessions, getSessionId } = useSessionManager();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentSessionId = getSessionId();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const activeSessions = await getActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const getDeviceIcon = (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? <Tablet className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getPlatform = (deviceInfo: any) => {
    if (deviceInfo?.platform) return deviceInfo.platform;
    const userAgent = deviceInfo?.userAgent || '';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown Platform';
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to terminate session",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Session Terminated",
        description: "The session has been successfully terminated"
      });

      loadSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Active Sessions</span>
          <Badge variant="secondary">{sessions.length}/5</Badge>
        </CardTitle>
        <CardDescription>
          You can have up to 5 active sessions across different devices. Older sessions are automatically removed when you exceed the limit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => {
          const isCurrentSession = session.session_id === currentSessionId;
          const deviceInfo = session.device_info || {};
          
          return (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isCurrentSession ? 'bg-primary/5 border-primary' : 'bg-secondary/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {getDeviceIcon(session.user_agent)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">
                      {getBrowserName(session.user_agent)} on {getPlatform(deviceInfo)}
                    </h4>
                    {isCurrentSession && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {format(new Date(session.last_active), 'MMM d, HH:mm')}</span>
                    </span>
                  </div>
                  {deviceInfo.timezone && (
                    <p className="text-xs text-gray-500">Timezone: {deviceInfo.timezone}</p>
                  )}
                </div>
              </div>
              
              {!isCurrentSession && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => terminateSession(session.session_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
        
        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
