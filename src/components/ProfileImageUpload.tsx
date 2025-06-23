
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageKey, setImageKey] = useState(0); // Force re-render of images

  // Always use the currentImageUrl from props instead of local state
  const displayImageUrl = currentImageUrl;

  // Listen for avatar updates to force image refresh
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      console.log('ProfileImageUpload received avatar update:', event.detail);
      if (event.detail.userId === user?.id) {
        setImageKey(prev => prev + 1);
        // Call onImageUpdate to sync parent component
        onImageUpdate(event.detail.avatarUrl);
      }
    };

    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('ProfileImageUpload received profile update:', event.detail);
      if (event.detail.userId === user?.id && event.detail.profile?.avatar_url) {
        setImageKey(prev => prev + 1);
        // Call onImageUpdate to sync parent component
        onImageUpdate(event.detail.profile.avatar_url);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [user?.id, onImageUpdate]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only PNG and JPEG images are supported.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Force image refresh
      setImageKey(prev => prev + 1);
      onImageUpdate(publicUrl);
      
      // Dispatch custom events to trigger UI updates across components
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          profile: { avatar_url: publicUrl }, 
          userId: user.id 
        } 
      }));
      
      // Additional event specifically for avatar updates
      window.dispatchEvent(new CustomEvent('avatarUpdated', { 
        detail: { 
          avatarUrl: publicUrl, 
          userId: user.id 
        } 
      }));
      
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully."
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
          {displayImageUrl ? (
            <img 
              src={`${displayImageUrl}?v=${imageKey}`}
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            className="hidden"
            id="profile-image-upload"
          />
          <label htmlFor="profile-image-upload">
            <Button variant="outline" disabled={uploadingImage} asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </span>
            </Button>
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Recommended: Square image, at least 200x200 pixels (PNG, JPEG only, max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
};
