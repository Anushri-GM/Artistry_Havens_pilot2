
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Order, CustomizationRequest } from '@/lib/types';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/context/translation-context';
import { Loader2, ChevronLeft, ShoppingBag } from 'lucide-react';
import { doc, query, collection, where } from 'firebase/firestore';
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
                                                <p className="text-sm font-bold text-primary">AI Price: ₹{req.price?.toFixed(2)}</p>
                                                <div className="flex justify-between items-end">
                                                    <Badge variant={
                                                        req.status === 'pending' ? 'secondary' : 'destructive'
                                                    }>{req.status}</Badge>
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
