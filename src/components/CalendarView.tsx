
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Video, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CalendarViewProps {
  meetings: any[];
  onMeetingClick: (meeting: any) => void;
  onDateClick?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ meetings, onMeetingClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => 
      isSameDay(new Date(meeting.start_time), day)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    if (isCurrentMonth && onDateClick) {
      onDateClick(day);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5" />
            <span>Meeting Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center text-sm sm:text-base">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map(day => {
            const dayMeetings = getMeetingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[60px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 relative group cursor-pointer
                  ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                  ${isDayToday ? 'ring-2 ring-primary' : ''}
                  transition-colors
                `}
                onClick={() => handleDateClick(day)}
              >
                {/* Date number */}
                <div className={`
                  text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-left
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isDayToday ? 'text-primary font-bold' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Add meeting button - Only show on desktop hover */}
                {isCurrentMonth && onDateClick && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-primary text-white hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {/* Meetings - Mobile optimized display */}
                <div className="space-y-0.5 sm:space-y-1">
                  {/* Mobile: Show only dots for meetings */}
                  <div className="sm:hidden">
                    {dayMeetings.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {dayMeetings.slice(0, 4).map((meeting, index) => (
                          <div
                            key={meeting.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMeetingClick(meeting);
                            }}
                            className="w-2 h-2 rounded-full bg-primary cursor-pointer"
                            title={meeting.title}
                          />
                        ))}
                        {dayMeetings.length > 4 && (
                          <div className="text-xs text-gray-500">+{dayMeetings.length - 4}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop: Show meeting details */}
                  <div className="hidden sm:block">
                    {dayMeetings.slice(0, 3).map(meeting => (
                      <div
                        key={meeting.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMeetingClick(meeting);
                        }}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-primary/10 text-primary border border-primary/20"
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          {meeting.meeting_type === 'online' ? (
                            <Video className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <Users className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate flex-1 text-xs font-medium">
                            {meeting.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs">{format(new Date(meeting.start_time), 'HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show meeting count if more than 3 */}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-gray-500 text-center bg-gray-100 rounded px-1 py-0.5">
                        +{dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instruction text */}
        <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
          <span className="hidden sm:inline">Click on any date to create a meeting, or click on existing meetings to view details</span>
          <span className="sm:hidden">Tap dates to create meetings • Tap dots to view meeting details</span>
        </div>
      </CardContent>
    </Card>
  );
};
