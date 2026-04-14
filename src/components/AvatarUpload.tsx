import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { uploadAvatar } from '@/core/services/platformService';

interface AvatarUploadProps {
  currentUrl?: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-20 w-20 text-2xl',
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentUrl, displayName, size = 'md' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setPreviewUrl(publicUrl);
      qc.invalidateQueries({ queryKey: ['streamer_profile'] });
      qc.invalidateQueries({ queryKey: ['all_profiles'] });
      toast({ title: 'Avatar updated' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setUploading(false);
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-border`}
        />
      ) : (
        <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-brand font-bold text-primary-foreground`}>
          {displayName[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Camera className="h-4 w-4 text-background" />
      </div>
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};
