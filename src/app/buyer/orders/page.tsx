'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Order } from '@/lib/types';
import { useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/context/translation-context';
import { Loader2, ChevronLeft, ShoppingBag } from 'lucide-react';
import { doc, query, collection, where } from 'firebase/firestore';
import Link from 'next/link';

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { translations } = useTranslation();
  const t_profile = translations.buyer_profile_page;
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

  const isLoading = isUserLoading || areOrdersLoading;

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
                                        <p className="text-xs text-muted-foreground">{t_profile.orderedOn} {order.orderDate ? format(order.orderDate.toDate(), 'PPP') : 'N/A'}</p>
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
                        <p>{t_profile.noPurchases}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
