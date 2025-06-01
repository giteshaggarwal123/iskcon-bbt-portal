
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Users, Mail, Calendar, Clock } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useMeetings } from '@/hooks/useMeetings';
import { useEmails } from '@/hooks/useEmails';
import { useMembers } from '@/hooks/useMembers';

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onOpenChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { documents } = useDocuments();
  const { meetings } = useMeetings();
  const { emails } = useEmails();
  const { members } = useMembers();

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: any[] = [];

    // Search documents
    const documentMatches = documents.filter(doc =>
      doc.name.toLowerCase().includes(query.toLowerCase())
    ).map(doc => ({
      id: doc.id,
      type: 'document',
      title: doc.name,
      subtitle: `${doc.folder || 'general'} folder`,
      date: new Date(doc.created_at).toLocaleDateString(),
      icon: FileText
    }));

    // Search meetings
    const meetingMatches = meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(query.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(query.toLowerCase())
    ).map(meeting => ({
      id: meeting.id,
      type: 'meeting',
      title: meeting.title,
      subtitle: meeting.description || '',
      date: new Date(meeting.start_time).toLocaleDateString(),
      icon: Calendar
    }));

    // Search emails
    const emailMatches = emails.filter(email =>
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.from.name.toLowerCase().includes(query.toLowerCase())
    ).map(email => ({
      id: email.id,
      type: 'email',
      title: email.subject,
      subtitle: `From ${email.from.name}`,
      date: new Date(email.receivedDateTime).toLocaleDateString(),
      icon: Mail
    }));

    // Search members
    const memberMatches = members.filter(member =>
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase())
    ).map(member => ({
      id: member.id,
      type: 'member',
      title: `${member.first_name} ${member.last_name}`,
      subtitle: member.email,
      date: new Date(member.created_at).toLocaleDateString(),
      icon: Users
    }));

    searchResults.push(...documentMatches, ...meetingMatches, ...emailMatches, ...memberMatches);
    setResults(searchResults);
    setLoading(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, documents, meetings, emails, members]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Global Search</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">Search across all documents, meetings, emails, and members</p>
        </DialogHeader>
        
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-96 px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}

          {!loading && results.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Start typing to search across all content</p>
            </div>
          )}

          <div className="space-y-2">
            {results.map((result) => {
              const IconComponent = result.icon;
              return (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                      <Badge className={`text-xs px-2 py-0 ${getTypeColor(result.type)}`}>
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{result.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
