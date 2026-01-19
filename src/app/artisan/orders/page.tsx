
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { Check, X, Package, Ship, CheckCircle, Loader2 } from 'lucide-react';
import type { Order, CustomizationRequest } from '@/lib/types';
import { useTranslation } from '@/context/translation-context';
import TutorialDialog from '@/components/tutorial-dialog';
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, updateDoc, Timestamp, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

type OrderStatus = 'Processing' | 'Shipped' | 'Delivered';

export default function OrdersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { translations } = useTranslation();
  const t = translations.orders_page;

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  // Fetch artisan data to get their specialized categories and name
  const artisanDocRef = useMemo(() => {
    if (user && firestore) {
      const docRef = doc(firestore, 'users', user.uid);
      (docRef as any).__memo = true;
      return docRef;
    }
    return null;
  }, [user, firestore]);
  const { data: artisanData } = useDoc<{ categories: string[]; name: string }>(artisanDocRef);
  
  // Fetch custom requests based on artisan's categories
  const requestsQuery = useMemo(() => {
    if (firestore && artisanData?.categories && artisanData.categories.length > 0) {
      const q = query(
        collection(firestore, 'CustomizationRequest'),
        where('status', '==', 'pending'),
        where('category', 'in', artisanData.categories)
      );
      (q as any).__memo = true;
      return q;
    }
    return null;
  }, [firestore, artisanData]);

  const { data: customRequestsData, isLoading: isLoadingRequests } = useCollection<CustomizationRequest>(requestsQuery);

  // Fetch regular orders for this artisan
  const ordersQuery = useMemo(() => {
    if (user && firestore) {
      const artisanRef = doc(firestore, 'users', user.uid);
      const q = query(collection(firestore, 'orders'), where('artisan', '==', artisanRef));
      (q as any).__memo = true;
      return q;
    }
    return null;
  }, [user, firestore]);
  
  const { data: myOrdersData, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isUserLoading || areOrdersLoading || isLoadingRequests;


  const handleAcceptRequest = (request: CustomizationRequest) => {
    if (!user || !firestore || !request.id || !artisanData?.name) return;
    
    setIsAccepting(request.id);
    
    const newOrder = {
        artisan: doc(firestore, 'users', user.uid),
        buyer: doc(firestore, 'users', request.buyerId),
        product: null,
        orderDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        productName: `Custom: ${request.description.substring(0, 30)}...`,
        productImageUrl: request.generatedImageUrl,
        buyerName: request.buyerName,
        artisanName: artisanData.name,
        quantity: 1,
        totalAmount: request.price || 0,
        status: 'Processing' as const,
        shippingAddress: request.buyerShippingAddress,
        paymentId: `pi_custom_${Date.now()}`,
        customizationDetails: request.description,
    };
    const ordersCollectionRef = collection(firestore, 'orders');
    const requestRef = doc(firestore, 'CustomizationRequest', request.id);

    addDoc(ordersCollectionRef, newOrder)
        .then(() => {
            // If adding the order succeeds, then delete the request.
            deleteDoc(requestRef)
            .then(() => {
                toast({
                    title: t.orderAcceptedToast,
                    description: "The request has been converted to an order in 'My Orders'.",
                });
            })
            .catch((deleteError) => {
                const permissionError = new FirestorePermissionError({
                    path: requestRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        })
        .catch((addError) => {
            const permissionError = new FirestorePermissionError({
                path: ordersCollectionRef.path,
                operation: 'create',
                requestResourceData: newOrder,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsAccepting(null);
        });
  };

  const handleDecline = (requestId: string) => {
    if (!firestore || !requestId) return;
    const requestRef = doc(firestore, 'CustomizationRequest', requestId);
    const updateData = { status: 'rejected' };
    
    updateDoc(requestRef, updateData)
        .then(() => {
             toast({
                variant: 'destructive',
                title: "Request Declined",
                description: "The custom design request has been declined.",
            });
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: requestRef.path,
                operation: 'update',
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleUpdate = (orderId: string) => {
    router.push(`/artisan/orders/update-status/${orderId}`);
  };

  const renderOrderList = (status: OrderStatus) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const filteredOrders = myOrdersData?.filter(order => order.status === status) || [];

    if (filteredOrders.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <p>{t.noOrdersInCategory}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-4">
               <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <Image
                    src={order.productImageUrl}
                    alt={order.productName}
                    width={96}
                    height={96}
                    className="rounded-md object-cover aspect-square bg-muted"
                />
               </div>
              <div className="flex-grow space-y-1">
                <CardTitle className="text-md font-headline leading-tight">{order.productName}</CardTitle>
                <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{t.quantity}: <span className="font-medium">{order.quantity}</span></p>
                    {order.orderDate && <p>{t.orderDate}: <span className="font-medium">{format(order.orderDate.toDate(), 'PPP')}</span></p>}
                </div>
                <p className="font-bold text-md pt-1">₹{(order.totalAmount).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto sm:self-center">
                <Button onClick={() => handleUpdate(order.id!)} size="sm">{t.updateStatusButton}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderRequests = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!customRequestsData || customRequestsData.length === 0) {
      return (
        <Card className="flex items-center justify-center p-12 border-dashed">
            <div className="text-center text-muted-foreground">
                <p className="text-lg">{t.noNewRequests}</p>
                <p className="text-sm">{t.checkBackLater}</p>
            </div>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {customRequestsData.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4 flex items-start gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <Image
                    src={request.generatedImageUrl}
                    alt="Custom design request"
                    width={96}
                    height={96}
                    className="rounded-md object-cover aspect-square bg-muted"
                />
               </div>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-md font-headline mb-1 leading-tight">{t.customRequestTitle}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                <p className="font-bold text-md text-primary">AI Price: ₹{request.price?.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-2 mt-0 w-auto">
                <Button onClick={() => handleAcceptRequest(request)} size="sm" className="whitespace-nowrap" disabled={isAccepting === request.id}>
                  {isAccepting === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                  {t.acceptButton}
                </Button>
                <Button onClick={() => handleDecline(request.id!)} variant="outline" size="sm" className="whitespace-nowrap">
                  <X className="mr-2 h-4 w-4" /> {t.declineButton}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto p-4 relative">
        <TutorialDialog pageId="orders" />
        <header className="mb-6 mt-12">
          <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </header>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">{t.orderRequestsTab}</TabsTrigger>
            <TabsTrigger value="my-orders">{t.myOrdersTab}</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="mt-4">
            {renderRequests()}
          </TabsContent>
          <TabsContent value="my-orders" className="mt-4">
            <Accordion type="multiple" defaultValue={['processing']} className="w-full space-y-2">
              <Card>
                  <AccordionItem value="processing" className="border-b-0">
                      <AccordionTrigger className="p-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" /> 
                            <span className="font-semibold">{t.processingTab}</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                          {renderOrderList('Processing')}
                      </AccordionContent>
                  </AccordionItem>
              </Card>
              <Card>
                  <AccordionItem value="shipped" className="border-b-0">
                      <AccordionTrigger className="p-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Ship className="h-5 w-5" /> 
                            <span className="font-semibold">{t.shippedTab}</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                          {renderOrderList('Shipped')}
                      </AccordionContent>
                  </AccordionItem>
              </Card>
              <Card>
                  <AccordionItem value="delivered" className="border-b-0">
                      <AccordionTrigger className="p-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" /> 
                            <span className="font-semibold">{t.deliveredTab}</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                          {renderOrderList('Delivered')}
                      </AccordionContent>
                  </AccordionItem>
              </Card>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
