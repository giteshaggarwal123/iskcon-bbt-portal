
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { addAllMembers } from '@/utils/bulkAddMembers';
import { useToast } from '@/hooks/use-toast';

export const OneTimeBulkAdd: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleBulkAdd = async () => {
    setIsAdding(true);
    try {
      await addAllMembers();
      setCompleted(true);
      toast({
        title: "Success!",
        description: "All members have been added to the portal successfully."
      });
    } catch (error) {
      console.error('Bulk add error:', error);
      toast({
        title: "Error",
        description: "Some members may not have been added. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (completed) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            All Members Added!
          </h3>
          <p className="text-sm text-muted-foreground">
            All 30 members have been successfully added to the portal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Add All Members</span>
        </CardTitle>
        <CardDescription>
          This will add all 30 members from your list to the portal as members with temporary passwords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleBulkAdd}
          disabled={isAdding}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? 'Adding Members...' : 'Add All Members Now'}
        </Button>
        {isAdding && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This may take a few minutes. Please wait...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
