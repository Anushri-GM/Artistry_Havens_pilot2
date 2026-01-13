
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
import { Loader2, Edit, Save, Star, Eye, EyeOff, Upload } from 'lucide-react';
import { artisans } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/context/translation-context';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';

  const [isEditing, setIsEditing] = useState(isSetupMode);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t = translations.profile_page;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [artisan, setArtisan] = useState({
      ...artisans[0],
      companyName: 'Elena\'s Ceramics',
      rating: 4.8,
      address: '123 Clay Street, Pottery Town, 45678',
      phone: '987-654-3210'
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      companyName: '',
      address: '',
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
            setArtisan(prev => ({...prev, ...data}));
            if(data.avatarUrl) {
                setImagePreview(data.avatarUrl);
            }
        } else {
             data = {
                name: artisan.name,
                companyName: artisan.companyName,
                address: artisan.address,
                phone: user.phoneNumber || artisan.phone,
            };
        }
        form.reset(data);
      }
    }
    
    if (!isUserLoading) {
      fetchProfile();
    }
  }, [user, isUserLoading, firestore, form, artisan.name, artisan.companyName, artisan.address, artisan.phone]);


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
        const userRef = doc(firestore, 'users', user.uid);
        const profileData = {
          name: data.name,
          companyName: data.companyName,
          address: data.address,
          avatarUrl: imagePreview || artisan.avatar.url,
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, profileData, { merge: true });

        setArtisan(prev => ({ ...prev, ...data, avatar: { url: profileData.avatarUrl, hint: prev.avatar.hint } }));
        setIsEditing(false);
        toast({
            title: t.profileUpdatedToast,
            description: t.profileUpdatedToastDesc,
        });

        if (isSetupMode) {
            router.push('/artisan/category-selection');
        }
    } catch (error) {
        console.error("Error updating profile:", error);
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-6 w-6 ${
            i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  if (isUserLoading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl pt-12">
        <div className="mb-4 flex justify-end items-center">
            {!isEditing && !isSetupMode && (
                <Button onClick={() => setIsEditing(true)} size="sm" className="bg-yellow-300 text-yellow-900 hover:bg-yellow-400">
                    <Edit className="mr-2 h-4 w-4" />
                    {t.editProfileButton}
                </Button>
            )}
        </div>
      <header className="mb-8">
        <div>
          <h1 className="font-headline text-4xl font-bold">{isSetupMode ? t.setupTitle : t.title}</h1>
          <p className="text-muted-foreground">{isSetupMode ? t.setupDescription : t.description}</p>
        </div>
      </header>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={imagePreview || artisan.avatar.url} alt={artisan.name} />
                  <AvatarFallback>{form.getValues('name')?.charAt(0) || 'A'}</AvatarFallback>
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
                            className="absolute bottom-0 right-0 rounded-full h-7 w-7 border-2 border-background"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                    </>
                )}
              </div>
              <div className="w-full">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.fullNameLabel}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-xl font-bold font-headline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <h2 className="font-headline text-2xl font-bold">{form.getValues('name')}</h2>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center">{renderStars(artisan.rating)}</div>
                  <span className="text-muted-foreground font-bold">{artisan.rating.toFixed(1)}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
                <Separator />
                
                <div>
                    <h3 className="font-headline text-xl font-semibold">{t.professionalDetailsTitle}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1"><Eye className="h-4 w-4"/>{t.visibleToAll}</p>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.companyNameLabel}</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="font-headline text-xl font-semibold">{t.personalDetailsTitle}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1"><EyeOff className="h-4 w-4"/>{t.visibleToSponsors}</p>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.addressLabel}</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
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
                </div>

                {isEditing && (
                <div className="flex justify-end gap-2">
                  {!isSetupMode && <Button type="button" variant="outline" onClick={() => {setIsEditing(false); form.reset({name: artisan.name, companyName: artisan.companyName, address: artisan.address, phone: artisan.phone}); setImagePreview(null);}}>{t.cancelButton}</Button>}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSetupMode ? t.setupSaveButton : t.saveButton}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageComponent />
    </Suspense>
  )
}
