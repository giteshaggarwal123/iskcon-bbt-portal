
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, BarChart3, Users, Calendar as CalendarIconLucide, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useReports } from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/use-mobile';

export const ReportsModule = () => {
  const [reportType, setReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const { loading, generateReport, downloadCSV, downloadPDF } = useReports();
  const isMobile = useIsMobile();

  const reportTypes = [
    { value: 'meetings', label: 'Meetings Report', icon: CalendarIconLucide },
    { value: 'documents', label: 'Documents Report', icon: FileText },
    { value: 'document_analytics', label: 'Document Analytics Report', icon: Eye },
    { value: 'voting', label: 'Voting Report', icon: BarChart3 },
    { value: 'members', label: 'Members Report', icon: Users },
    { value: 'comprehensive', label: 'Comprehensive Report', icon: FileText }
  ];

  const handleGenerateReport = async (format: 'csv' | 'pdf') => {
    if (!reportType) {
      alert('Please select a report type');
      return;
    }

    const data = await generateReport(reportType, dateRange.start && dateRange.end ? dateRange as { start: Date; end: Date } : undefined);
    
    if (data) {
      if (format === 'csv') {
        const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
        if (Array.isArray(data)) {
          downloadCSV(data, filename);
        } else {
          // For comprehensive reports, download each section
          Object.entries(data).forEach(([key, values]) => {
            downloadCSV(values as any[], `${key}_${filename}`);
          });
        }
      } else {
        downloadPDF(data, reportType);
      }
    }
  };

  return (
    <div className={`w-full min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      <div className={`w-full max-w-7xl mx-auto ${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
        {/* Header Section - Mobile optimized */}
        <div className="space-y-2">
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Reports & Analytics
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
            Generate and download comprehensive reports
          </p>
        </div>

        {/* Report Generation Form - Mobile optimized */}
        <Card className="w-full">
          <CardHeader className={isMobile ? 'p-4 pb-3' : 'pb-4'}>
            <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Generate Report</CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : 'text-base'}>
              Select the type of report you want to generate and download
            </CardDescription>
          </CardHeader>
          <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : 'pt-0'}`}>
            {/* Form Fields - Mobile responsive grid */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              <div className="space-y-2">
                <label className={`font-medium block ${isMobile ? 'text-sm' : 'text-sm'}`}>Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className={isMobile ? 'h-10' : ''}>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span className={isMobile ? 'text-sm' : ''}>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className={`font-medium block ${isMobile ? 'text-sm' : 'text-sm'}`}>Start Date (Optional)</label>
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${isMobile ? 'h-10 text-sm' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? format(dateRange.start, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, start: date }));
                        setShowStartCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className={`font-medium block ${isMobile ? 'text-sm' : 'text-sm'}`}>End Date (Optional)</label>
                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${isMobile ? 'h-10 text-sm' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? format(dateRange.end, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, end: date }));
                        setShowEndCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons - Mobile responsive */}
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <Button 
                onClick={() => handleGenerateReport('csv')}
                disabled={!reportType || loading}
                className={`flex items-center justify-center space-x-2 ${isMobile ? 'w-full h-10' : ''}`}
              >
                <Download className="h-4 w-4" />
                <span>Download CSV</span>
              </Button>
              
              <Button 
                onClick={() => handleGenerateReport('pdf')}
                disabled={!reportType || loading}
                variant="outline"
                className={`flex items-center justify-center space-x-2 ${isMobile ? 'w-full h-10' : ''}`}
              >
                <FileText className="h-4 w-4" />
                <span>Download PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Mobile optimized */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
          <Card>
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col space-x-0 space-y-2 text-center' : ''}`}>
                <CalendarIconLucide className={`text-blue-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div>
                  <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Meetings</p>
                  <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col space-x-0 space-y-2 text-center' : ''}`}>
                <FileText className={`text-green-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div>
                  <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Documents</p>
                  <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>156</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col space-x-0 space-y-2 text-center' : ''}`}>
                <Eye className={`text-purple-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div>
                  <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Document Views</p>
                  <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>1,024</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col space-x-0 space-y-2 text-center' : ''}`}>
                <Users className={`text-orange-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div>
                  <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Members</p>
                  <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>42</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
