
import React from 'react';
import { Calendar, FileText, Users, Mail, Clock, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DocumentsModule } from './DocumentsModule';
import { MeetingsModule } from './MeetingsModule';
import { VotingModule } from './VotingModule';
import { AttendanceModule } from './AttendanceModule';
import { EmailModule } from './EmailModule';
import { MembersModule } from './MembersModule';
import { SettingsModule } from './SettingsModule';
import { ReportsModule } from './ReportsModule';

interface DashboardProps {
  currentModule?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentModule = 'dashboard' }) => {
  // Render specific module based on currentModule prop
  switch (currentModule) {
    case 'documents':
      return <DocumentsModule />;
    case 'meetings':
      return <MeetingsModule />;
    case 'voting':
      return <VotingModule />;
    case 'attendance':
      return <AttendanceModule />;
    case 'email':
      return <EmailModule />;
    case 'members':
      return <MembersModule />;
    case 'settings':
      return <SettingsModule />;
    case 'reports':
      return <ReportsModule />;
    default:
      // Default dashboard content
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bureau Dashboard</h1>
              <p className="text-gray-600">Welcome to ISKCON Bureau Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-semibold">Jan 18, 2024 2:30 PM</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">3</h3>
                  <p className="text-sm text-gray-500">Upcoming Meetings</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">2</h3>
                  <p className="text-sm text-gray-500">Active Polls</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">15</h3>
                  <p className="text-sm text-gray-500">New Documents</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">7</h3>
                  <p className="text-sm text-gray-500">Unread Emails</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Monthly Bureau Meeting</h3>
                    <p className="text-sm text-gray-500">Jan 20, 2024 • 10:00 AM</p>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Upcoming</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Emergency Committee</h3>
                    <p className="text-sm text-gray-500">Jan 18, 2024 • 2:00 PM</p>
                  </div>
                  <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">Completed</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Active Voting</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Temple Expansion Budget</h3>
                    <p className="text-sm text-gray-500">8/12 votes cast</p>
                  </div>
                  <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Festival Committee</h3>
                    <p className="text-sm text-gray-500">5/12 votes cast</p>
                  </div>
                  <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};
