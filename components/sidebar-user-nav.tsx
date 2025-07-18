'use client';

import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { 
  Settings, LogOut, User, FileText, Save, 
  Linkedin, BookText, Mic, MicOff
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getUserProfile, updateProfileInfo } from '@/app/actions/profile-actions';
import { UserProfile } from '@/lib/db/schema-profile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SidebarUserNav() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    stylePreference: '',
    linkedInServices: '',
  });
  
  // Deepgram voice transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch user profile when settings modal is opened
  useEffect(() => {
    if (isSettingsOpen && user?.id) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          const result = await getUserProfile();
          
          if (result.success && result.profile) {
            setUserProfile(result.profile);
            
            // Debug linkedInServices
            console.log('Profile data:', result.profile);
            console.log('linkedInServices value:', result.profile.linkedInServices);
            
            // Populate form data with profile information
            setFormData({
              fullName: result.profile.fullName || '',
              bio: result.profile.bio || '',
              stylePreference: result.profile.stylePreference || '',
              linkedInServices: result.profile.linkedInServices || '',
            });
          } else {
            throw new Error(result.error || 'Failed to load profile');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          toast({
            type: 'error',
            description: 'Failed to load your profile information',
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserProfile();
    }
  }, [isSettingsOpen, user?.id]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle voice recording for Deepgram transcription
  const startRecording = async (fieldName: string) => {
    try {
      setActiveField(fieldName);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioWithDeepgram(audioBlob, fieldName);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        type: 'error',
        description: 'Could not access microphone. Please check permissions.',
      });
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const processAudioWithDeepgram = async (audioBlob: Blob, fieldName: string) => {
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send the audio to your API endpoint that handles Deepgram transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await response.json();
      
      if (data.transcription) {
        // Update the form data with the transcription
        setFormData(prev => ({
          ...prev,
          [fieldName]: prev[fieldName as keyof typeof prev] + ' ' + data.transcription,
        }));
        
        toast({
          type: 'success',
          description: 'Voice transcription added',
        });
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        type: 'error',
        description: 'Failed to transcribe audio',
      });
    }
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const result = await updateProfileInfo({
        fullName: formData.fullName,
        bio: formData.bio,
        stylePreference: formData.stylePreference,
        linkedInServices: formData.linkedInServices,
      });
      
      if (result.success) {
        toast({
          description: 'Profile updated successfully',
          type: 'success',
        });
        setIsEditing(false);
        // Update local userProfile state
        if (result.profile) {
          setUserProfile(result.profile);
        }
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-10">
        <div className="size-8 bg-zinc-500/30 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center justify-center h-10 cursor-pointer">
            <Image
              src={user.imageUrl || `https://avatar.vercel.sh/${user.emailAddresses[0]?.emailAddress}`}
              alt={user.emailAddresses[0]?.emailAddress ?? 'User Avatar'}
              width={32}
              height={32}
              className="rounded-full hover:opacity-80 transition-opacity"
              data-testid="user-nav-button"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid="user-nav-menu"
          side="top"
          align="center"
          className="w-56"
        >
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
            Settings
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild data-testid="user-nav-item-auth">
            <button
              type="button"
              className="w-full cursor-pointer flex items-center gap-2"
              onClick={() => {
                signOut(() => router.push('/'));
              }}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoaderIcon size={32} />
            </div>
          ) : userProfile ? (
            <div className="py-4">
              {/* User Avatar and Name */}
              <div className="flex items-center gap-4 mb-6">
                <Image
                  src={user.imageUrl || `https://avatar.vercel.sh/${user.emailAddresses[0]?.emailAddress}`}
                  alt={user.emailAddresses[0]?.emailAddress ?? 'User Avatar'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
                <div>
                  <h2 className="text-xl font-semibold">
                    {isEditing ? (
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    ) : (
                      userProfile.fullName || 'User'
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">Full Name</p>
                    </div>
                    <div className="relative">
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                        onClick={() => isRecording && activeField === 'fullName' ? stopRecording() : startRecording('fullName')}
                      >
                        {isRecording && activeField === 'fullName' ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">Bio</p>
                    </div>
                    <div className="relative">
                      <Textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Enter a short bio"
                        rows={3}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-6 text-muted-foreground hover:text-primary"
                        onClick={() => isRecording && activeField === 'bio' ? stopRecording() : startRecording('bio')}
                      >
                        {isRecording && activeField === 'bio' ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">LinkedIn Services</p>
                    </div>
                    <div className="relative">
                      <Textarea
                        name="linkedInServices"
                        value={formData.linkedInServices}
                        onChange={handleInputChange}
                        placeholder="What products or services do you sell on LinkedIn?"
                        rows={3}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-6 text-muted-foreground hover:text-primary"
                        onClick={() => isRecording && activeField === 'linkedInServices' ? stopRecording() : startRecording('linkedInServices')}
                      >
                        {isRecording && activeField === 'linkedInServices' ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookText className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">Style Preference</p>
                    </div>
                    <Select
                      value={formData.stylePreference}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          stylePreference: value
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laura">Laura</SelectItem>
                        <SelectItem value="Jake">Jake</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.fullName || 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Bio</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.bio || 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Linkedin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">LinkedIn Services</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.linkedInServices || 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BookText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Style Preference</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.stylePreference || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No profile information available.</p>
              <p className="text-sm text-muted-foreground mt-1">Complete the onboarding to set up your profile.</p>
            </div>
          )}
          
          <DialogFooter>
            {isEditing ? (
              <div className="flex w-full justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to current profile values
                    if (userProfile) {
                      setFormData({
                        fullName: userProfile.fullName || '',
                        bio: userProfile.bio || '',
                        stylePreference: userProfile.stylePreference || '',
                        linkedInServices: userProfile.linkedInServices || '',
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoaderIcon size={16} />                      
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex w-full justify-between">
                <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
