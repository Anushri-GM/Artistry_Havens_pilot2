
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { generateProductDetails } from '@/ai/flows/generate-product-details';
import { enhanceProductImage } from '@/ai/flows/enhance-product-image';
import { productCategories as baseProductCategories, artisans } from '@/lib/data';
import type { Product } from '@/lib/types';
import ProductPreview from '@/components/product-preview';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Camera, Sparkles, ChevronLeft, Eye, Wand2, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog';
import ProductCard from '@/components/product-card';
import { useTranslation } from '@/context/translation-context';
import { useLanguage } from '@/context/language-context';
import TutorialDialog from '@/components/tutorial-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { HeaderActions } from '@/components/artisan-sidebar';


const formSchema = z.object({
  productName: z.string().min(3, 'Product name is required.'),
  productCategory: z.string().min(1, 'Product category is required.'),
  productDescription: z.string().min(10, 'Product description is required.'),
  productStory: z.string().min(10, 'Product story is required.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  materials: z.string().min(3, 'Materials are required.'),
  dimensions: z.string().min(3, 'Dimensions are required.'),
  availableQuantity: z.coerce.number().int().min(0, 'Quantity must be a whole number.'),
});

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useTranslation();
  const { language } = useLanguage();
  const t = translations.add_product_page;
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating = useState(false);
  const [isEnhancing, setIsEnhancing = useState(false);
  const [mainImagePreview, setMainImagePreview = useState<string | null>(null);
  const [mainImageData, setMainImageData = useState<string | null>(null);
  const [additionalImages, setAdditionalImages = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCamera, setUseCamera = useState(false);
  const [hasCameraPermission, setHasCameraPermission = useState<boolean | null>(null);
  const [stream, setStream = useState<MediaStream | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const [previewProduct, setPreviewProduct = useState<Product | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      productCategory: '',
      productDescription: '',
      productStory: '',
      price: 0,
      materials: '',
      dimensions: '',
      availableQuantity: 1,
    },
  });

  const formValues = form.watch();

  useEffect(() => {
    if (useCamera) {
      const getCameraPermission = async () => {
        if (typeof window !== 'undefined' && navigator.mediaDevices) {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
            setHasCameraPermission(true);
          } catch (error) {
            console.error(t.cameraError, error);
            setHasCameraPermission(false);
            setUseCamera(false);
            toast({
              variant: 'destructive',
              title: t.cameraAccessDenied,
              description: t.cameraAccessDeniedDesc,
            });
          }
        } else {
          setHasCameraPermission(false);
        }
      };
      getCameraPermission();
    }
  
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useCamera, stream, t.cameraAccessDenied, t.cameraAccessDeniedDesc, t.cameraError, toast]);


  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setMainImagePreview(dataUrl);
        setMainImageData(dataUrl);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentImageCount = additionalImages.length;
      const filesArray = Array.from(files);
      const remainingSlots = 3 - currentImageCount;

      if (filesArray.length > remainingSlots) {
        toast({
            variant: "destructive",
            title: "Image Limit Exceeded",
            description: `You can only upload ${remainingSlots} more image(s).`,
        });
      }

      const newImagePromises = filesArray.slice(0, remainingSlots).map(file => {
          return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
          });
      });

      Promise.all(newImagePromises).then(newImages => {
          setAdditionalImages(prev => [...prev, ...newImages]);
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  }
  
  const stopCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setUseCamera(false);
  }

  const handleEnhanceImage = async () => {
    if (!mainImageData) {
      toast({
        variant: 'destructive',
        title: t.noImageToast,
        description: t.noImageToastDesc,
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const enhancedResult = await enhanceProductImage({ photoDataUri: mainImageData });
      
      setMainImagePreview(enhancedResult);
      setMainImageData(enhancedResult);
      toast({
        title: t.enhanceSuccessToast,
        description: t.enhanceSuccessToastDesc,
      });
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast({
        variant: 'destructive',
        title: t.enhanceFailedToast,
        description: t.enhanceFailedToastDesc,
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateDetails = async () => {
    if (!mainImageData) {
      toast({
        variant: 'destructive',
        title: t.noImageToast,
        description: t.noImageToastDesc,
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDetails({ 
        photoDataUri: mainImageData,
        targetLanguage: language,
      });
      
      form.setValue('productName', result.productName);
      form.setValue('productDescription', result.productDescription);
      form.setValue('productStory', result.productStory);
      form.setValue('productCategory', result.productCategory);

      toast({
        title: t.detailsGeneratedToast,
        description: t.detailsGeneratedToastDesc,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.generationFailedToast,
        description: t.generationFailedDesc,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const compressImage = (dataUrl: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleSize = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject('Could not get canvas context');
            }
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for better compression
        };
        img.onerror = reject;
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!mainImageData) {
        toast({
            variant: 'destructive',
            title: t.noImageToast,
            description: t.noImageToastDesc,
        });
        return;
    }
     if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to create a product.',
      });
      return;
    }
    setIsLoading(true);

    try {
        const compressedMainImage = await compressImage(mainImageData);
        const compressedAdditionalImages = await Promise.all(additionalImages.map(img => compressImage(img)));
        
        const productsRef = collection(firestore, 'products');
        const newProdRef = doc(productsRef);

        const newProduct = {
            id: newProdRef.id,
            artisanId: user.uid,
            name: values.productName,
            price: values.price,
            mainImageUrl: compressedMainImage,
            additionalImageUrls: compressedAdditionalImages,
            category: values.productCategory,
            description: values.productDescription,
            story: values.productStory,
            materials: values.materials,
            dimensions: values.dimensions,
            availableQuantity: values.availableQuantity,
            likes: 0,
            sales: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        await setDoc(newProdRef, newProduct);

        toast({
            title: t.productSavedToast,
            description: t.productSavedToastDesc,
        });
        router.push('/artisan/my-products');

    } catch (error) {
        console.error('Error saving product to Firestore:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Save Product',
            description: 'Could not save the product. Please check your connection and security rules.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const startCamera = async () => {
    stopCamera();
    setMainImagePreview(null);
    setUseCamera(true);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setMainImagePreview(dataUrl);
      setMainImageData(dataUrl);
      stopCamera();
    }
  };
  
  const handlePreview = async () => {
    const { productName, productDescription, productStory, productCategory, price } = form.getValues();

    setPreviewProduct({
      id: 'preview',
      name: productName || 'Product Name',
      artisan: artisans[0],
      price: price || 0,
      image: {
        url: mainImagePreview || `https://picsum.photos/seed/placeholder/400/500`,
        hint: 'product preview'
      },
      category: productCategory || 'Category',
      description: productDescription || 'Description',
      story: productStory || 'Your story about this product...',
      likes: 0,
      sales: 0
    });
  };

  const getCategoryDisplayValue = (value: string) => {
    const index = baseProductCategories.findIndex(c => c === value);
    if (index !== -1 && translations.product_categories.length > index) {
      return translations.product_categories[index];
    }
    return value;
  };


  return (
    <div className="p-4 relative">
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-14 flex items-center justify-between border-b bg-card px-4 z-50">
            <Button onClick={() => router.back()} variant="ghost" size="icon">
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">{t.backButton}</span>
            </Button>
            <h1 className="text-lg font-semibold">{t.title}</h1>
            <HeaderActions />
        </header>

        <div className="mt-14">
            <div className="flex justify-end mb-2">
                <TutorialDialog pageId="add-product" />
            </div>
            <Card className="w-full max-w-xl mx-auto shadow-lg">
                <CardHeader>
                    <div className="text-center">
                        <CardTitle className="font-headline text-xl md:text-2xl">{t.title}</CardTitle>
                        <CardDescription>{t.description}</CardDescription>
                    </div>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            {/* Main Image Section */}
                            <FormItem>
                                <FormLabel>Main Product Image</FormLabel>
                                <div className="flex justify-end">
                                    {mainImageData && (
                                        <Button
                                            onClick={handleEnhanceImage}
                                            disabled={isEnhancing}
                                            size="sm"
                                            variant="secondary"
                                            type="button"
                                            className="bg-yellow-300 text-yellow-900 hover:bg-yellow-400 h-8"
                                        >
                                            {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            {t.enhanceButton}
                                        </Button>
                                    )}
                                </div>
                                <div className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-secondary overflow-hidden">
                                    {useCamera ? (
                                    <>
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                        {hasCameraPermission === false && (
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <Alert variant="destructive">
                                            <AlertTitle>{t.cameraAccessRequired}</AlertTitle>
                                            <AlertDescription>{t.cameraAccessDescription}</AlertDescription>
                                            </Alert>
                                        </div>
                                        )}
                                    </>
                                    ) : mainImagePreview ? (
                                    <div className="relative w-full h-full">
                                        <Image src={mainImagePreview} alt="Preview" fill className="object-contain"/>
                                    </div>
                                    ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Upload className="w-8 h-8 mb-2" />
                                        <p className="text-sm font-semibold">{t.uploadPlaceholder}</p>
                                    </div>
                                    )}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" onChange={handleMainImageChange} accept="image/*" ref={mainFileInputRef} />
                            
                                {useCamera && stream ? (
                                    <Button onClick={handleCapture} className="w-full" type="button">
                                        <Camera className="mr-2 h-4 w-4" />
                                        {t.captureButton}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col space-y-2">
                                        <Button onClick={() => mainFileInputRef.current?.click()} variant="outline" className="h-12 flex items-center justify-center" type="button">
                                            <Upload className="mr-2 h-4 w-4" />
                                            <span>{t.uploadButton}</span>
                                        </Button>
                                        <Button onClick={startCamera} variant="outline" className="h-12 flex items-center justify-center" type="button">
                                            <Camera className="mr-2 h-4 w-4" />
                                            <span>{t.cameraButton}</span>
                                        </Button>
                                    </div>
                                )}
                            </FormItem>

                            {/* Additional Images Section */}
                            <FormItem>
                                <FormLabel>Additional Images (up to 3)</FormLabel>
                                <div className="grid grid-cols-3 gap-2">
                                    {additionalImages.map((image, index) => (
                                        <div key={index} className="relative aspect-square">
                                            <Image src={image} alt={`Additional image ${index + 1}`} fill className="object-cover rounded-md" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                                onClick={() => removeAdditionalImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {additionalImages.length < 3 && (
                                    <>
                                    <Input
                                        id="additional-images-input"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        ref={additionalFileInputRef}
                                        onChange={handleAdditionalImagesChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => additionalFileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Add More Images ({additionalImages.length}/3)
                                    </Button>
                                    </>
                                )}
                            </FormItem>

                            <Button onClick={handleGenerateDetails} disabled={isGenerating || !mainImageData} className="w-full" type="button">
                                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.generatingDetailsButton}</> : <><Sparkles className="mr-2 h-4 w-4" />{t.generateDetailsButton}</>}
                            </Button>
                        
                            <FormField control={form.control} name="productName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.productNameLabel}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="productCategory" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.productCategoryLabel}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.selectCategoryPlaceholder}>
                                            {getCategoryDisplayValue(field.value)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {baseProductCategories.map((cat, index) => (
                                        <SelectItem key={cat} value={cat}>
                                            {translations.product_categories[index] || cat}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="productDescription" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.productDescriptionLabel}</FormLabel>
                                <FormControl><Textarea {...field} className="h-24" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="productStory" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.productStoryLabel}</FormLabel>
                                <FormControl><Textarea {...field} className="h-24" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                             <FormField control={form.control} name="materials" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Materials</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., Clay, Natural Dyes, Cotton" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                             <FormField control={form.control} name="dimensions" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dimensions</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., 12cm x 10cm x 10cm" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t.priceLabel}</FormLabel>
                                    <FormControl><Input type="number" placeholder={t.pricePlaceholder} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                <FormField control={form.control} name="availableQuantity" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Available Quantity</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                            </div>
                            <div className="items-top flex space-x-2 pt-2">
                                <Checkbox id="social-media-consent" />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                    htmlFor="social-media-consent"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                    {t.socialMediaConsentLabel}
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                    {t.socialMediaConsentDescription}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row gap-2">
                            <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" onClick={handlePreview} type="button">
                                <Eye className="mr-2 h-4 w-4" />
                                {t.previewButton}
                                </Button>
                            </DialogTrigger>
                            <DialogContent showCloseButton={false} className="max-w-sm w-full h-full max-h-screen p-0 m-0 overflow-y-auto flex flex-col">
                                <div className="relative p-4 border-b">
                                    <DialogTitle className="text-center font-headline">{t.previewTitle}</DialogTitle>
                                    <DialogClose asChild className="absolute left-2 top-1/2 -translate-y-1/2">
                                        <Button variant="ghost" size="icon">
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                    </DialogClose>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                {previewProduct && <ProductPreview product={previewProduct} />}
                                </div>
                            </DialogContent>
                            </Dialog>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t.savingProductButton : t.saveProductButton}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    </div>
  );
}

    