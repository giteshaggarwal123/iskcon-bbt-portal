
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarLoaderProps {
  userName: string;
  className?: string;
  refreshTrigger?: number;
  userId?: string;
}

export const ProfileAvatarLoader: React.FC<ProfileAvatarLoaderProps> = ({ 
  userName, 
  className = "h-10 w-10",
  refreshTrigger = 0,
  userId
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [imageKey, setImageKey] = useState(0);

  const fetchUserAvatar = async () => {
    if (!userId) return;

    try {
      console.log('Fetching avatar for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        console.log('Avatar URL fetched:', data.avatar_url);
        setAvatarUrl(data.avatar_url);
        setImageKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  useEffect(() => {
    fetchUserAvatar();
  }, [userId, refreshTrigger]);

  // Listen for avatar updates for the specific user
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      console.log('Avatar update event received:', event.detail);
      if (event.detail.userId === userId) {
        setAvatarUrl(event.detail.avatarUrl);
        setImageKey(prev => prev + 1);
      }
    };

    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received:', event.detail);
      if (event.detail.userId === userId && event.detail.profile?.avatar_url) {
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
  }, [userId]);

  // Create a cache-busted URL
  const getCacheBustedUrl = (url: string) => {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${imageKey}&t=${Date.now()}`;
  };

  return (
    <Avatar className={`${className} flex-shrink-0`}>
      <AvatarImage 
        src={getCacheBustedUrl(avatarUrl)} 
        alt={userName}
        key={`${imageKey}-${Date.now()}`}
      />
      <AvatarFallback className="bg-primary text-white">
        {userName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
