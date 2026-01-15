
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut, User, ShoppingBag, ChevronLeft, Edit, Save, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/context/translation-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface BuyerOrder extends Product {
  orderDate: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().optional(),
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

  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const { translations } = useTranslation();
  const t = translations.buyer_profile_page;
  
  const [isEditing, setIsEditing] = useState(isSetupMode);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
      name: 'Buyer',
      avatarUrl: '',
      phone: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem('buyerOrders') || '[]');
    setOrders(storedOrders);
  }, []);

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
            data = { name: '', phone: user.phoneNumber || '' };
        }
        form.reset({
            name: data.name || '',
            phone: data.phone || user.phoneNumber || '',
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
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            {t.logoutButton}
                        </Button>
                    )}
                </form>
             </Form>
        </CardContent>
      </Card>
      
      {!isSetupMode && (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><ShoppingBag className="h-5 w-5"/>{t.orderHistoryTitle}</CardTitle>
                <CardDescription>{t.orderHistoryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id}>
                                <div className="flex gap-4">
                                    <Image src={order.image.url} alt={order.name} width={64} height={64} className="rounded-md object-cover aspect-square bg-muted"/>
                                    <div className="flex-grow">
                                        <h4 className="font-semibold">{order.name}</h4>
                                        <p className="text-sm text-muted-foreground">{translations.buyer_product_page.by} {order.artisan.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.orderedOn} {format(new Date(order.orderDate), 'PPP')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₹{order.price.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">{order.status}</p>
                                    </div>
                                </div>
                            <Separator className="my-4" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>{t.noPurchases}</p>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
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
