
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/context/translation-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import TutorialDialog from '@/components/tutorial-dialog';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function MyProductsPage() {
  const { translations } = useTranslation();
  const t = translations.my_products_page;
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const productsQuery = useMemo(() => {
    if (user && firestore) {
      const productsRef = collection(firestore, 'products');
      // Create a document reference to the user's document
      const artisanRef = doc(firestore, `users/${user.uid}`);
      // Query for products where the 'artisan' field matches the reference
      return query(productsRef, where('artisan', '==', artisanRef));
    }
    return null;
  }, [user, firestore]);

  const { data: myProducts, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const formatTimeAgo = (date: any) => {
    try {
      // Handle both Firebase Timestamp and string dates
      const jsDate = date instanceof Timestamp ? date.toDate() : new Date(date);
      const distance = formatDistanceToNow(jsDate);
      if (translations.add_product_page.cameraError.includes('Error')) { // A simple check for English
          return `Added ${distance} ago`;
      }
      // A simple placeholder for other languages.
      return `${t.added} ${distance} ${t.ago}`;
    } catch (e) {
      return t.justAdded;
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete || !firestore) return;

    try {
        const productRef = doc(firestore, 'products', productToDelete.id);
        await deleteDoc(productRef);

        toast({
            title: t.deleteToastTitle,
            description: t.deleteToastDescription.replace('{productName}', productToDelete.name),
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        toast({
            variant: 'destructive',
            title: "Deletion Failed",
            description: "Could not delete the product. Please try again.",
        });
    }

    setProductToDelete(null); // Close the dialog
  };

  const isLoading = isUserLoading || areProductsLoading;

  return (
    <>
      <div className="container mx-auto p-4 relative">
        <TutorialDialog pageId="my-products" />
        <header className="mb-6 flex items-center justify-between mt-12">
          <div>
            <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
        </header>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : myProducts && myProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {myProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={product.mainImageUrl || product.image.url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
                <CardHeader className="p-2 sm:p-3">
                  <CardTitle className="font-headline text-sm sm:text-base truncate">{product.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {product.createdAt ? 
                      formatTimeAgo(product.createdAt) :
                      t.justAdded
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm sm:text-md font-semibold">₹{product.price.toFixed(2)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>{t.editButton}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t.deleteButton}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardTitle>{t.noProductsTitle}</CardTitle>
            <CardDescription className="mt-2 mb-6">
              {t.noProductsDescription}
            </CardDescription>
            <Button asChild>
              <Link href="/artisan/add-product">
                <PlusCircle className="mr-2 h-4 w-4" /> {t.addProductButton}
              </Link>
            </Button>
          </Card>
        )}
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
                {t.deleteDialogDescription.replace('{productName}', productToDelete?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>{t.cancelButton}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>{t.deleteButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
