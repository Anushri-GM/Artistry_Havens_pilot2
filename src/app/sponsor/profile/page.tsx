
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Save, Upload, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/translation-context';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function SponsorProfilePageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';

  const [isEditing, setIsEditing] = useState(isSetupMode);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t = translations.sponsor_profile_page;
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const [profileData, setProfileData] = useState({
      name: 'Sponsor',
      avatarUrl: '',
      phone: ''
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        let data;
        if (docSnap.exists()) {
            data = docSnap.data();
            setProfileData(prev => ({...prev, ...data}));
            if(data.avatarUrl) {
                setImagePreview(data.avatarUrl);
            }
        } else {
             data = {
                name: '',
                phone: user.phoneNumber || '',
            };
        }
        
        form.reset({
            name: data.name || '',
            phone: data.phone || user.phoneNumber || '',
        });
      }
    }
    
    if (!isUserLoading) {
      fetchProfile();
    }
  }, [user, isUserLoading, firestore, form]);


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to update your profile.',
        });
        return;
    }
    setIsLoading(true);

    try {
        const userDocRef = doc(firestore, "users", user.uid);
        const newProfileData = {
          name: data.name,
          avatarUrl: imagePreview || profileData.avatarUrl,
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfileData, { merge: true });

        setProfileData(prev => ({ ...prev, ...data, avatarUrl: newProfileData.avatarUrl }));
        setIsEditing(false);
        toast({
            title: t.profileUpdatedToast,
            description: t.profileUpdatedToastDesc,
        });

        if (isSetupMode) {
            router.push('/sponsor/dashboard');
        }
    } catch (error) {
        console.error("Error saving sponsor profile to Firestore: ", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'There was an error saving your profile.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: translations.buyer_profile_page.logoutSuccessToast,
        description: translations.buyer_profile_page.logoutSuccessToastDesc,
      });
      router.push('/');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: translations.buyer_profile_page.logoutFailedToast,
        description: translations.buyer_profile_page.logoutFailedToastDesc,
      });
    }
  };

  if (isUserLoading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold">{isSetupMode ? "Set Up Your Profile" : t.title}</h1>
          <p className="text-muted-foreground">{isSetupMode ? "Complete your profile to start sponsoring artisans." : t.description}</p>
        </div>
        {!isEditing && !isSetupMode && (
            <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t.editProfileButton}
            </Button>
        )}
      </header>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start gap-6">
               <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={imagePreview || profileData.avatarUrl} alt={profileData.name} />
                  <AvatarFallback>{form.getValues('name')?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                {isEditing && (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-0 right-0 rounded-full h-8 w-8 border-2 border-background"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                    </>
                )}
              </div>
              <div className="w-full pt-2">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.fullNameLabel}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-2xl font-bold font-headline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <h2 className="font-headline text-3xl font-bold">{form.getValues('name')}</h2>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.phoneLabel}</FormLabel>
                            <FormControl>
                            <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                {isEditing && (
                <div className="flex justify-end gap-2">
                  {!isSetupMode && <Button type="button" variant="outline" onClick={() => {setIsEditing(false); form.reset({name: profileData.name, phone: profileData.phone}); setImagePreview(null);}}>{t.cancelButton}</Button>}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSetupMode ? "Save and Continue" : t.saveButton}
                  </Button>
                </div>
              )}

              {!isSetupMode && (
                 <Button onClick={handleLogout} variant="outline" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    {translations.buyer_profile_page.logoutButton}
                 </Button>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default function SponsorProfilePage() {
    return (
        <Suspense>
            <SponsorProfilePageComponent />
        </Suspense>
    )
}
