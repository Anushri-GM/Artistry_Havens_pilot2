'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import type { Order, CustomizationRequest } from '@/lib/types';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/context/translation-context';
import { Loader2, ChevronLeft, ShoppingBag, X, Check } from 'lucide-react';
import { doc, query, collection, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t_orders = translations.buyer_orders_page;
  
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Fetch buyer's profile to get shipping address for new orders
  const buyerProfileRef = useMemo(() => {
    if (user && firestore) {
      const ref = doc(firestore, 'users', user.uid);
      (ref as any).__memo = true;
      return ref;
    }
    return null;
  }, [user, firestore]);
  const { data: buyerProfile } = useDoc<{ name: string, location?: string }>(buyerProfileRef);


  const ordersQuery = useMemo(() => {
    if (user && firestore) {
      const buyerRef = doc(firestore, 'users', user.uid);
      const q = query(collection(firestore, 'orders'), where('buyer', '==', buyerRef));
      (q as any).__memo = true;
      return q;
    }
    return null;
  }, [user, firestore]);
  const { data: orders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

  const requestsQuery = useMemo(() => {
    if (user && firestore) {
      const q = query(collection(firestore, 'CustomizationRequest'), where('buyerId', '==', user.uid));
      (q as any).__memo = true;
      return q;
    }
    return null;
  }, [user, firestore]);
  const { data: customRequests, isLoading: areRequestsLoading } = useCollection<CustomizationRequest>(requestsQuery);

  const isLoading = isUserLoading || areOrdersLoading || areRequestsLoading;

  const handleAcceptQuote = async (request: CustomizationRequest) => {
    if (!user || !firestore || !request.id || !request.artisanId || !buyerProfile) {
        toast({ variant: 'destructive', title: "Error", description: "Missing required information to create order." });
        return;
    }
    if (!buyerProfile.location) {
        toast({ variant: 'destructive', title: "Address Missing", description: "Please add a shipping address to your profile." });
        router.push('/buyer/profile');
        return;
    }

    setIsSubmitting(request.id);
    try {
        // 1. Create the new order
        const newOrder = {
            artisan: doc(firestore, 'users', request.artisanId),
            buyer: doc(firestore, 'users', user.uid),
            product: null, // This is a custom product, no reference
            orderDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            productName: `Custom: ${request.description.substring(0, 30)}...`,
            productImageUrl: request.generatedImageUrl,
            buyerName: buyerProfile.name || 'Valued Customer',
            artisanName: request.artisanName || 'Artisan',
            quantity: 1,
            totalAmount: request.price || 0,
            status: 'Processing' as const,
            shippingAddress: buyerProfile.location,
            paymentId: `pi_custom_${Date.now()}`,
            customizationDetails: request.description,
        };
        await addDoc(collection(firestore, 'orders'), newOrder);

        // 2. Update the request status
        const requestRef = doc(firestore, 'CustomizationRequest', request.id);
        await updateDoc(requestRef, { status: 'accepted' });

        toast({ title: t_orders.quoteAccepted, description: t_orders.orderCreated });

    } catch (error) {
        console.error("Error accepting quote: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not accept the offer." });
    } finally {
        setIsSubmitting(null);
    }
  };

  const handleRejectQuote = async (requestId: string) => {
    if (!firestore || !requestId) return;
    setIsSubmitting(requestId);
    try {
        const requestRef = doc(firestore, 'CustomizationRequest', requestId);
        await updateDoc(requestRef, { status: 'rejected' });
        toast({ variant: 'destructive', title: t_orders.quoteRejected });
    } catch (error) {
        console.error("Error rejecting quote: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not reject the offer." });
    } finally {
        setIsSubmitting(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {translations.buyer_product_page.backButton}
        </Button>
      
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><ShoppingBag className="h-5 w-5"/>{t_orders.title}</CardTitle>
                <CardDescription>{t_orders.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="orders">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="orders">{t_orders.ordersTab}</TabsTrigger>
                        <TabsTrigger value="requests">{t_orders.requestsTab}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="orders" className="mt-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            </div>
                        ) : orders && orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div key={order.id}>
                                        <div className="flex gap-4 items-center">
                                            <Image src={order.productImageUrl} alt={order.productName} width={64} height={64} className="rounded-md object-cover aspect-square bg-muted"/>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold">{order.productName}</h4>
                                                <p className="text-sm text-muted-foreground">{translations.buyer_product_page.by} {order.artisanName}</p>
                                                <p className="text-xs text-muted-foreground">{translations.buyer_profile_page.orderedOn} {order.orderDate ? format(order.orderDate.toDate(), 'PPP') : 'N/A'}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                                                <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                                            </div>
                                        </div>
                                    <Separator className="mt-4" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>{translations.buyer_profile_page.noPurchases}</p>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="requests" className="mt-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            </div>
                        ) : customRequests && customRequests.length > 0 ? (
                            <div className="space-y-4">
                                {customRequests.map(req => (
                                    <div key={req.id}>
                                        <div className="flex gap-4">
                                            <Image src={req.generatedImageUrl} alt={req.description} width={64} height={64} className="rounded-md object-cover aspect-square bg-muted"/>
                                            <div className="flex-grow space-y-1">
                                                <h4 className="font-semibold line-clamp-2">{req.description}</h4>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <Badge variant={
                                                            req.status === 'pending' ? 'secondary' :
                                                            req.status === 'quoted' ? 'default' :
                                                            req.status === 'accepted' ? 'secondary' :
                                                            'destructive'
                                                        }>{req.status}</Badge>
                                                        {req.status === 'quoted' && <p className="text-sm font-bold text-primary">₹{req.price?.toFixed(2)}</p>}
                                                    </div>
                                                    {req.status === 'quoted' && (
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="destructive" onClick={() => handleRejectQuote(req.id!)} disabled={isSubmitting === req.id}>
                                                                {isSubmitting === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                                                            </Button>
                                                            <Button size="sm" onClick={() => handleAcceptQuote(req)} disabled={isSubmitting === req.id}>
                                                                {isSubmitting === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="mt-4" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center text-muted-foreground py-8">
                                <p>{t_orders.noRequests}</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
