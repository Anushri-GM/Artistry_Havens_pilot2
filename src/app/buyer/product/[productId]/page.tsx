'use client';

import { useParams, useRouter } from 'next/navigation';
import { products } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ShoppingCart, Loader2 } from 'lucide-react';
import Reviews from '@/components/reviews';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/context/translation-context';
import type { Product } from '@/lib/types';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { ToastAction } from "@/components/ui/toast";


export default function BuyerProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.productId as string;
  const product = products.find(p => p.id === productId);
  const { translations } = useTranslation();
  const t = translations.buyer_product_page;

  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch buyer's profile to get their name for denormalization
  const buyerProfileRef = useMemo(() => {
    if (user && firestore) {
      const ref = doc(firestore, 'users', user.uid);
      (ref as any).__memo = true;
      return ref;
    }
    return null;
  }, [user, firestore]);
  const { data: buyerProfile } = useDoc<{ name: string, location?: string }>(buyerProfileRef);


  if (!product) {
    return <div className="p-4 text-center">{t.productNotFound}</div>;
  }

  const handleBuyNow = async () => {
     if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to place an order.',
      });
      return;
    }

    if (!buyerProfile) {
        toast({ title: 'Profile not loaded', description: 'Please wait a moment and try again.'});
        return;
    }

    if (!buyerProfile.location || buyerProfile.location.trim() === '') {
        toast({
            variant: 'destructive',
            title: 'No Shipping Address',
            description: 'Please add a shipping address to your profile before placing an order.',
            action: <ToastAction altText="Go to profile" onClick={() => router.push('/buyer/profile')}>Go to Profile</ToastAction>,
        });
        return;
    }
    
    if (!product || !product.artisan.id) {
         toast({
            variant: 'destructive',
            title: 'Product Error',
            description: 'This product or its artisan is invalid.',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const ordersRef = collection(firestore, 'orders');
      
      const newOrder = {
        artisan: doc(firestore, 'users', product.artisan.id),
        buyer: doc(firestore, 'users', user.uid),
        product: doc(firestore, 'products', product.id),
        orderDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        productName: product.name,
        productImageUrl: product.image.url,
        buyerName: buyerProfile.name || 'Valued Customer',
        artisanName: product.artisan.name,
        quantity: 1,
        totalAmount: product.price,
        status: 'Processing' as const, // Default status
        shippingAddress: buyerProfile.location,
        paymentId: `pi_${new Date().getTime()}`, // Mock data
        customizationDetails: ''
      };

      await addDoc(ordersRef, newOrder);
      
      toast({
        title: t.toastTitle,
        description: t.toastDescription.replace('{productName}', product.name),
      });

      router.push('/buyer/orders');

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: error.message || 'Could not place your order. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
       <Button onClick={() => router.back()} variant="ghost" className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.backButton}
      </Button>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full">
            <Image
              src={product.image.url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </CardContent>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-2xl md:text-3xl">{product.name}</CardTitle>
            <p className="font-semibold text-xl md:text-2xl pt-2 whitespace-nowrap">₹{product.price.toFixed(2)}</p>
          </div>
           <CardDescription>{t.by} {product.artisan.name}</CardDescription>
           {product.reviews && <Reviews rating={product.reviews.rating} count={product.reviews.count} />}
        </CardHeader>
        <CardContent>
            <Separator className="my-4" />
            <div>
                <h3 className="font-headline text-lg font-semibold mb-2">{t.description}</h3>
                <p className="text-muted-foreground">{product.description}</p>
            </div>
            {product.story && (
                <>
                    <Separator className="my-4" />
                    <div>
                        <h3 className="font-headline text-lg font-semibold mb-2">{t.story}</h3>
                        <p className="text-muted-foreground italic">"{product.story}"</p>
                    </div>
                </>
            )}
        </CardContent>
        <CardContent>
            <Button onClick={handleBuyNow} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Placing Order..." : t.buyNowButton}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
