import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, BookOpen, Check, AlertTriangle } from 'lucide-react';

type ScheduleEvent = {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
};

type SchedulePreviewProps = {
  scheduleData: any;
  events: ScheduleEvent[];
};

export function SchedulePreview({ scheduleData, events }: SchedulePreviewProps) {
  if (!scheduleData || !events || events.length === 0) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
        No schedule data available
      </div>
    );
  }
  
  // Count unique subjects
  const uniqueSubjects = new Set(
    events
      .map(event => event.summary.replace('Study: ', '').split('(')[0].trim())
  ).size;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold flex items-center text-blue-800">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Study Schedule for {scheduleData.examName}
        </h3>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-blue-700">
            <Clock className="h-4 w-4 mr-1" />
            <span>{scheduleData.totalDays} days • {scheduleData.dailyHours} hours/day</span>
          </div>
          
          <div className="flex items-center bg-green-50 px-3 py-1 rounded-full text-green-700">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>{uniqueSubjects} subjects</span>
          </div>
          
          {scheduleData.schedulingStyle && (
            <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full text-purple-700">
              <Check className="h-4 w-4 mr-1" />
              <span className="capitalize">{scheduleData.schedulingStyle} style</span>
            </div>
          )}
        </div>
      </div>      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableCaption>
            <span className="text-xs text-gray-500">
              Study schedule optimized for {scheduleData.preferredTimeOfDay || 'flexible'} study times
              {scheduleData.includeBreaks ? ' with breaks included' : ''}
            </span>
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Topics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, index) => {
              // Parse dates
              const startDate = new Date(event.startTime);
              const endDate = new Date(event.endTime);
              
              // Check if this is a break
              const isBreak = event.summary === 'Break';
              
              // Extract subject from summary (removing "Study: " prefix if present)
              const subject = event.summary.replace('Study: ', '');
              
              // Extract topics from description
              const topicsMatch = event.description.match(/Topics: (.*?)(?:\n|$)/);
              const topics = topicsMatch ? topicsMatch[1] : '';
              
              // Extract difficulty if present
              const difficultyMatch = subject.match(/\((.*?) difficulty\)/);
              const difficulty = difficultyMatch ? difficultyMatch[1] : null;
              
              // Get clean subject name without the difficulty
              const cleanSubject = subject.split('(')[0].trim();
              
              // Determine row styling based on content
              const rowClass = isBreak ? 'bg-green-50' : '';
              
              return (
                <TableRow key={index} className={rowClass}>
                  <TableCell>{formatDate(startDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {formatDate(startDate, 'h:mm a')} - {formatDate(endDate, 'h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{cleanSubject}</div>
                    {difficulty && (
                      <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block 
                        ${difficulty === 'hard' ? 'bg-red-100 text-red-800' : 
                          difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {difficulty}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {isBreak ? 'Rest period' : topics}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500">
          This schedule was generated for {scheduleData.examName} based on your preferences.
        </div>
      </div>
    </div>
  );
}
