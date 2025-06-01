
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Calendar, Users, Mail, Clock } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useMeetings } from '@/hooks/useMeetings';
import { useEmails } from '@/hooks/useEmails';
import { useMembers } from '@/hooks/useMembers';

interface SearchResult {
  id: string;
  type: 'document' | 'meeting' | 'email' | 'member';
  title: string;
  description: string;
  date?: string;
  metadata?: any;
}

interface GlobalSearchProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  trigger, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const { documents } = useDocuments();
  const { meetings } = useMeetings();
  const { emails } = useEmails();
  const { members } = useMembers();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = isControlled ? controlledOnOpenChange : setOpen;

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const queryLower = searchQuery.toLowerCase();

    // Search documents
    documents.forEach(doc => {
      if (
        doc.name.toLowerCase().includes(queryLower) ||
        doc.folder?.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: doc.id,
          type: 'document',
          title: doc.name,
          description: `Document in ${doc.folder || 'General'} folder`,
          date: doc.created_at || undefined,
          metadata: doc
        });
      }
    });

    // Search meetings
    meetings.forEach(meeting => {
      if (
        meeting.title.toLowerCase().includes(queryLower) ||
        meeting.description?.toLowerCase().includes(queryLower) ||
        meeting.location?.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: meeting.id,
          type: 'meeting',
          title: meeting.title,
          description: meeting.description || `Meeting on ${new Date(meeting.start_time).toLocaleDateString()}`,
          date: meeting.start_time,
          metadata: meeting
        });
      }
    });

    // Search emails
    emails.forEach(email => {
      if (
        email.subject.toLowerCase().includes(queryLower) ||
        email.body.toLowerCase().includes(queryLower) ||
        email.from.name.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: email.id,
          type: 'email',
          title: email.subject,
          description: `From ${email.from.name}`,
          date: email.receivedDateTime,
          metadata: email
        });
      }
    });

    // Search members
    members.forEach(member => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
      if (
        fullName.toLowerCase().includes(queryLower) ||
        member.email?.toLowerCase().includes(queryLower) ||
        member.phone?.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: member.id,
          type: 'member',
          title: fullName || 'Unknown Member',
          description: member.email || 'No email provided',
          metadata: member
        });
      }
    });

    // Sort by relevance (exact matches first, then partial)
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === queryLower;
      const bExact = b.title.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.title.localeCompare(b.title);
    });

    setResults(searchResults.slice(0, 20)); // Limit results
    setLoading(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, documents, meetings, emails, members]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate module/view based on result type
    console.log('Navigate to:', result.type, result.id);
    setIsOpen?.(false);
    setQuery('');
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start text-muted-foreground">
      <Search className="h-4 w-4 mr-2" />
      Search everything...
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Global Search</span>
          </DialogTitle>
          <DialogDescription>
            Search across all documents, meetings, emails, and members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="pl-10"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {result.description}
                          </p>
                          {result.date && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {new Date(result.date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className={getTypeColor(result.type)}>
                        {result.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {!query && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Start typing to search across all content</p>
              <div className="flex justify-center space-x-2 mt-4">
                <Badge variant="outline">Documents</Badge>
                <Badge variant="outline">Meetings</Badge>
                <Badge variant="outline">Emails</Badge>
                <Badge variant="outline">Members</Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
