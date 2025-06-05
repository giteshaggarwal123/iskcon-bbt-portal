
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface DocumentFiltersProps {
  searchTerm: string;
  typeFilter: string;
  peopleFilter: string;
  dateFilter: string;
  uniqueUploaders: string[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId: string | undefined;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onPeopleFilterChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchTerm,
  typeFilter,
  peopleFilter,
  dateFilter,
  uniqueUploaders,
  userProfiles,
  currentUserId,
  onSearchChange,
  onTypeFilterChange,
  onPeopleFilterChange,
  onDateFilterChange
}) => {
  const getUserDisplayName = (userId: string) => {
    if (userId === currentUserId) return 'You';
    const profile = userProfiles[userId];
    if (profile && (profile.first_name || profile.last_name)) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    return 'User';
  };

  return (
    <div className="flex justify-between items-center space-x-4">
      <div className="flex space-x-4 flex-1">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="word">Word</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
            <SelectItem value="image">Images</SelectItem>
          </SelectContent>
        </Select>

        <Select value={peopleFilter} onValueChange={onPeopleFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="People" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All People</SelectItem>
            {uniqueUploaders.map(uploaderId => (
              <SelectItem key={uploaderId} value={uploaderId}>
                {getUserDisplayName(uploaderId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={onDateFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
