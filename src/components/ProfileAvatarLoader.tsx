
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarLoaderProps {
  userName: string;
  className?: string;
  refreshTrigger?: number;
}

export const ProfileAvatarLoader: React.FC<ProfileAvatarLoaderProps> = ({ 
  userName, 
  className = "h-10 w-10",
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [imageKey, setImageKey] = useState(0); // Force re-render of images

  const fetchUserAvatar = async () => {
    if (!user) return;

    try {
      console.log('Fetching avatar for user:', user.id);
      
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
        console.log('Avatar URL fetched:', data.avatar_url);
        setAvatarUrl(data.avatar_url);
        setImageKey(prev => prev + 1); // Force image refresh
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  useEffect(() => {
    fetchUserAvatar();
  }, [user, refreshTrigger]);

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      console.log('Avatar update event received:', event.detail);
      if (event.detail.userId === user?.id) {
        setAvatarUrl(event.detail.avatarUrl);
        setImageKey(prev => prev + 1);
      }
    };

    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received:', event.detail);
      if (event.detail.userId === user?.id && event.detail.profile?.avatar_url) {
        setAvatarUrl(event.detail.profile.avatar_url);
        setImageKey(prev => prev + 1);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [user?.id]);

  return (
    <Avatar className={`${className} flex-shrink-0`}>
      <AvatarImage 
        src={avatarUrl ? `${avatarUrl}?v=${imageKey}` : ''} 
        alt={userName} 
      />
      <AvatarFallback className="bg-primary text-white">
        {userName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
