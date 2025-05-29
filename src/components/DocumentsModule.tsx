
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Folder, File, Download, Eye, Share2, MessageSquare, Clock, User } from 'lucide-react';

export const DocumentsModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');

  const folders = [
    { id: 'all', name: 'All Documents', count: 45 },
    { id: 'meetings', name: 'Meeting Materials', count: 12 },
    { id: 'resolutions', name: 'Resolutions', count: 8 },
    { id: 'policies', name: 'Policies', count: 15 },
    { id: 'reports', name: 'Reports', count: 10 }
  ];

  const documents = [
    {
      id: 1,
      name: 'Annual Meeting Agenda 2024.pdf',
      type: 'PDF',
      size: '2.4 MB',
      folder: 'meetings',
      uploadedBy: 'General Secretary',
      uploadedAt: '2024-01-15',
      version: '1.2',
      views: 23,
      comments: 5,
      shared: true
    },
    {
      id: 2,
      name: 'Temple Construction Policy.docx',
      type: 'DOCX',
      size: '1.8 MB',
      folder: 'policies',
      uploadedBy: 'Building Committee',
      uploadedAt: '2024-01-14',
      version: '2.0',
      views: 67,
      comments: 12,
      shared: false
    },
    {
      id: 3,
      name: 'Financial Report Q4.xlsx',
      type: 'XLSX',
      size: '856 KB',
      folder: 'reports',
      uploadedBy: 'Finance Team',
      uploadedAt: '2024-01-13',
      version: '1.0',
      views: 34,
      comments: 8,
      shared: true
    }
  ];

  const analytics = [
    { document: 'Annual Meeting Agenda 2024.pdf', views: 23, avgTime: '5:30', completion: 85 },
    { document: 'Temple Construction Policy.docx', views: 67, avgTime: '12:45', completion: 78 },
    { document: 'Financial Report Q4.xlsx', views: 34, avgTime: '8:15', completion: 92 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Organize, share, and track all ISKCON documents</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents, keywords, content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{doc.size}</span>
                          <span>v{doc.version}</span>
                          <span>by {doc.uploadedBy}</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        {doc.views}
                      </Badge>
                      <Badge variant="secondary">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {doc.comments}
                      </Badge>
                      {doc.shared && <Badge className="bg-success text-white">Shared</Badge>}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                      <p className="text-sm text-gray-500">{folder.count} documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            {analytics.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.document}</CardTitle>
                  <CardDescription>Document engagement analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{item.views}</div>
                      <div className="text-sm text-gray-500">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{item.avgTime}</div>
                      <div className="text-sm text-gray-500">Avg. Reading Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{item.completion}%</div>
                      <div className="text-sm text-gray-500">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
