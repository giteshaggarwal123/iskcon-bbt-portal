
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        
        if (error.message.includes('row-level security')) {
          console.log('User may not have access to their profile yet, creating...');
          await createProfileIfNeeded();
          return;
        }
        
        throw error;
      }

      if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      } else {
        console.log('No profile found, creating...');
        await createProfileIfNeeded();
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Profile Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfileIfNeeded = async () => {
    if (!user) return;

    try {
      const newProfile = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        phone: user.phone || '',
        avatar_url: '',
        updated_at: new Date().toISOString()
      };

      console.log('Creating profile:', newProfile);

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        
        if (createError.message.includes('row-level security')) {
          console.log('RLS prevented profile creation, profile might already exist');
          setTimeout(() => fetchProfile(), 1000);
          return;
        }
        
        throw createError;
      }
      
      console.log('Profile created successfully:', createdProfile);
      setProfile(createdProfile);
    } catch (error: any) {
      console.error('Error creating profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      console.log('Updating profile with:', updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        
        if (error.message.includes('row-level security')) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to make this update",
            variant: "destructive"
          });
          return { error };
        }
        
        throw error;
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      
      // Force immediate refresh
      setRefreshTrigger(prev => prev + 1);
      
      // Dispatch events with slight delay to ensure all components are ready
      setTimeout(() => {
        const eventDetail = { profile: data, userId: user.id };
        console.log('Dispatching profile update from useProfile:', eventDetail);
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: eventDetail }));
      }, 50);

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
      return { error };
    }
  };

  const refreshProfile = () => {
    console.log('Forcing profile refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    fetchProfile();
  }, [user, refreshTrigger]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('useProfile received profile update event:', event.detail);
      if (event.detail.userId === user?.id) {
        fetchProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  }, [user?.id]);

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile,
    fetchProfile
  };
};
