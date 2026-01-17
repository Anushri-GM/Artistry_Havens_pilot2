'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut, User, ShoppingBag, ChevronLeft, Edit, Save, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Order } from '@/lib/types';
import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useTranslation } from '@/context/translation-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function BuyerProfilePageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';

  const { toast } = useToast();
  const auth = getAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const { translations } = useTranslation();
  const t = translations.buyer_profile_page;
  
  const [isEditing, setIsEditing] = useState(isSetupMode);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
      name: 'Buyer',
      avatarUrl: '',
      phone: '',
      location: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '', location: '' },
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
            if (data.avatarUrl) setImagePreview(data.avatarUrl);
        } else {
            data = { name: '', phone: user.phoneNumber || '', location: '' };
        }
        form.reset({
            name: data.name || '',
            phone: data.phone || user.phoneNumber || '',
            location: data.location || '',
        });
      }
    }
    if (!isUserLoading) fetchProfile();
  }, [user, isUserLoading, firestore, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
        const userDocRef = doc(firestore, "users", user.uid);
        const newProfileData = {
          name: data.name,
          location: data.location,
          avatarUrl: imagePreview || profileData.avatarUrl,
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfileData, { merge: true });

        setProfileData(prev => ({ ...prev, ...data, avatarUrl: newProfileData.avatarUrl }));
        setIsEditing(false);
        toast({ title: "Profile Updated", description: "Your details have been saved." });
        if (isSetupMode) router.push('/buyer/home');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save your profile.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: t.logoutSuccessToast, description: t.logoutSuccessToastDesc });
      router.push('/');
    } catch (error) {
      toast({ variant: 'destructive', title: t.logoutFailedToast, description: t.logoutFailedToastDesc });
    }
  };
  
  if (isUserLoading && !isSetupMode) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {!isSetupMode && (
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {translations.buyer_product_page.backButton}
        </Button>
      )}
      
      <Card className="w-full shadow-lg mb-6">
        <CardHeader className='flex flex-row justify-between items-start'>
            <div>
                <CardTitle className="font-headline text-2xl md:text-3xl">{isSetupMode ? "Set Up Your Profile" : t.title}</CardTitle>
                <CardDescription>{isSetupMode ? "Complete your profile to personalize your experience." : t.description}</CardDescription>
            </div>
             {!isEditing && !isSetupMode && (
                <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            )}
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={imagePreview || profileData.avatarUrl} />
                                <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                            </Avatar>
                             {isEditing && (
                                <>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    <Button type="button" size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-6 w-6 border-2 border-background" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="w-full">
                            {isEditing ? (
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            ) : (
                                <h3 className="font-semibold text-lg">{form.getValues('name') || "Buyer"}</h3>
                            )}
                             <p className="text-sm text-muted-foreground">{user?.phoneNumber}</p>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        {isEditing ? (
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Shipping Address</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Enter your full shipping address..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        ) : (
                            <p className="text-sm text-muted-foreground">{form.getValues('location') || 'No shipping address set. Please edit your profile to add one.'}</p>
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-2">
                          {!isSetupMode && <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>}
                          <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSetupMode ? "Save and Continue" : "Save Changes"}
                          </Button>
                        </div>
                    )}

                    {!isSetupMode && (
                        <div className="space-y-2">
                             <Button onClick={() => router.push('/buyer/orders')} variant="outline" className="w-full">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                {t.orderHistoryTitle}
                            </Button>
                            <Button onClick={handleLogout} variant="outline" className="w-full">
                                <LogOut className="mr-2 h-4 w-4" />
                                {t.logoutButton}
                            </Button>
                        </div>
                    )}
                </form>
             </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BuyerProfilePage() {
    return (
        <Suspense>
            <BuyerProfilePageComponent />
        </Suspense>
    )
}
