
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Video, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarViewProps {
  meetings: any[];
  onMeetingClick: (meeting: any) => void;
  onDateClick?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ meetings, onMeetingClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useIsMobile();

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
      <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            <span>Meeting Calendar</span>
          </CardTitle>
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size={isMobile ? "sm" : "sm"} onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className={`font-medium text-center ${isMobile ? 'min-w-[100px] text-sm' : 'min-w-[120px]'}`}>
              {format(currentDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
            </span>
            <Button variant="outline" size={isMobile ? "sm" : "sm"} onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, index) => (
            <div key={day} className={`p-2 text-center font-medium text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dayMeetings = getMeetingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  relative group border border-gray-200 rounded-sm
                  ${isMobile ? 'min-h-[60px] p-1' : 'min-h-[100px] p-2'}
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isDayToday ? 'ring-2 ring-primary' : ''}
                  ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
                onClick={() => handleDateClick(day)}
              >
                {/* Date number */}
                <div className={`
                  font-medium mb-1
                  ${isMobile ? 'text-xs' : 'text-sm'}
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isDayToday ? 'text-primary font-bold' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Add meeting button - desktop only */}
                {!isMobile && isCurrentMonth && onDateClick && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                
                {/* Meetings for this day */}
                <div className="space-y-1">
                  {isMobile ? (
                    // Mobile view - show dots and count
                    <>
                      {dayMeetings.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dayMeetings.slice(0, 2).map((meeting, index) => (
                            <div
                              key={meeting.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMeetingClick(meeting);
                              }}
                              className="w-2 h-2 rounded-full bg-primary cursor-pointer hover:bg-primary/80"
                              title={`${meeting.title} - ${format(new Date(meeting.start_time), 'HH:mm')}`}
                            />
                          ))}
                          {dayMeetings.length > 2 && (
                            <div className="text-xs text-gray-600 font-medium">
                              +{dayMeetings.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    // Desktop view - show meeting cards
                    <>
                      {dayMeetings.slice(0, 2).map(meeting => (
                        <div
                          key={meeting.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMeetingClick(meeting);
                          }}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-primary/10 text-primary border border-primary/20"
                        >
                          <div className="flex items-center space-x-1">
                            {meeting.meeting_type === 'online' ? (
                              <Video className="h-3 w-3 shrink-0" />
                            ) : (
                              <Users className="h-3 w-3 shrink-0" />
                            )}
                            <span className="truncate flex-1">
                              {meeting.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{format(new Date(meeting.start_time), 'HH:mm')}</span>
                          </div>
                        </div>
                      ))}
                      
                      {dayMeetings.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayMeetings.length - 2} more
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile: Add meeting button on tap */}
                {isMobile && isCurrentMonth && onDateClick && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity bg-black/5">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className={`mt-4 text-gray-500 text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {isMobile ? (
            <>Tap date to create meeting • Tap dots to view details</>
          ) : (
            <>Click on any date to create a meeting, or click on existing meetings to view details</>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
