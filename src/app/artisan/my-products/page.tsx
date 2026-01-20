
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/context/translation-context';
import { useLanguage } from '@/context/language-context';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TutorialDialog from '@/components/tutorial-dialog';

export default function MyProductsPage() {
  const { translations } = useTranslation();
  const t = translations.my_products_page;
  const { toast } = useToast();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SalesAnalysis | null>(null);
  const [currentOpenDialog, setCurrentOpenDialog] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const productsQuery = useMemo(() => {
    if (user && firestore) {
      const productsRef = collection(firestore, 'products');
      // Create a document reference to the user's document
      const artisanRef = doc(firestore, `users/${user.uid}`);
      // Query for products where the 'artisan' field matches the reference
      const q = query(productsRef, where('artisan', '==', artisanRef));
      (q as any).__memo = true;
      return q;
    }
    return null;
  }, [user, firestore]);

  const { data: myProducts, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const formatTimeAgo = (date: any) => {
    try {
      const distance = formatDistanceToNow(new Date(date));
      if (translations.add_product_page.cameraError.includes('Error')) { // A simple check for English
          return `Added ${distance} ago`;
      }
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
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={product.mainImageUrl || ''}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
                <CardHeader className="p-2 sm:p-3 flex-grow">
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
                    <Dialog onOpenChange={(open) => onDialogOpenChange(open, product)}>
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
                          <DialogTrigger asChild>
                            <DropdownMenuItem>
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>{t.analyzeButton}</span>
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{t.deleteButton}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>{analysisResult ? `${t.analysisFor} ${product.name}`: t.generatingAnalysisTitle}</DialogTitle>
                          </DialogHeader>
                          {analysisResult ? (
                            <div className="py-4 space-y-4">
                              <div className="flex items-center justify-between">
                                  <div className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", getPerformanceBadgeColor(analysisResult.predictedPerformance))}>
                                     {t.predictedPerformance}: {analysisResult.predictedPerformance}
                                  </div>
                                  {analysisResult.analysisAudio && (
                                      <Button
                                          size="icon"
                                          variant="ghost"
                                          className={cn("h-8 w-8 rounded-full", isPlaying && "bg-accent text-accent-foreground")}
                                          onClick={handlePlayPause}
                                          aria-label="Play audio analysis"
                                      >
                                          <Volume2 className="h-5 w-5" />
                                          <audio ref={audioRef} src={analysisResult.analysisAudio} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={handleAudioEnded} />
                                      </Button>
                                  )}
                              </div>
                              <div>
                                <h3 className="font-semibold mb-1">{t.analysisTitle}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.analysis}</p>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-1">{t.suggestionsTitle}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.suggestions}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 flex justify-center items-center h-48">
                              <div className="text-center space-y-2">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto"/>
                                <p className="text-sm text-muted-foreground">{t.generatingAnalysisDesc}</p>
                              </div>
                            </div>
                          )}
                          <DialogClose asChild>
                              <Button type="button" variant="secondary" className="w-full">{t.closeButton}</Button>
                          </DialogClose>
                      </DialogContent>
                    </Dialog>
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
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">{t.deleteButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
