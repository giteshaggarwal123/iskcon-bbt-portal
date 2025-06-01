
import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, Users, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'meeting' | 'member' | 'email';
  date?: string;
  folder?: string;
}

export const GlobalSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search documents
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .ilike('name', `%${term}%`);

      documents?.forEach(doc => {
        searchResults.push({
          id: doc.id,
          title: doc.name,
          description: `Document in ${doc.folder || 'General'} folder`,
          type: 'document',
          date: doc.created_at,
          folder: doc.folder
        });
      });

      // Search meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`);

      meetings?.forEach(meeting => {
        searchResults.push({
          id: meeting.id,
          title: meeting.title,
          description: meeting.description || 'No description',
          type: 'meeting',
          date: meeting.start_time
        });
      });

      // Search members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);

      profiles?.forEach(profile => {
        searchResults.push({
          id: profile.id,
          title: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
          description: profile.email || 'No email',
          type: 'member',
          date: profile.created_at
        });
      });

      // Search emails
      const { data: emails } = await supabase
        .from('emails')
        .select('*')
        .or(`subject.ilike.%${term}%,body.ilike.%${term}%`);

      emails?.forEach(email => {
        searchResults.push({
          id: email.id,
          title: email.subject,
          description: email.body?.substring(0, 100) + '...' || 'No content',
          type: 'email',
          date: email.created_at
        });
      });

      setResults(searchResults);
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to perform search",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Global Search</h1>
        <p className="text-gray-600">Search across all documents, meetings, members, and communications</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search everything..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getIcon(result.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{result.title}</CardTitle>
                    <p className="text-sm text-gray-600">{result.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="capitalize">
                    {result.type}
                  </Badge>
                  {result.date && (
                    <span className="text-xs text-gray-500">
                      {formatDate(result.date)}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {searchTerm && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or browse specific modules
            </p>
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-500">
              Enter a search term to find documents, meetings, members, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
