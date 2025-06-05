
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarLoaderProps {
  userName: string;
  className?: string;
  refreshTrigger?: number; // Add a prop to trigger refresh
}

export const ProfileAvatarLoader: React.FC<ProfileAvatarLoaderProps> = ({ 
  userName, 
  className = "h-10 w-10",
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const fetchUserAvatar = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  useEffect(() => {
    fetchUserAvatar();
  }, [user, refreshTrigger]); // Include refreshTrigger in dependencies

  return (
    <Avatar className={`${className} flex-shrink-0`}>
      <AvatarImage src={avatarUrl} alt={userName} />
      <AvatarFallback className="bg-primary text-white">
        {userName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
