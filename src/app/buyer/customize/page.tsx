
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { buyerAiDesignedProducts } from '@/ai/flows/buyer-ai-designed-products';
import { categories as baseCategoriesData } from '@/lib/data';
import 'regenerator-runtime/runtime';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Mic, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from '@/context/translation-context';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { ToastAction } from '@/components/ui/toast';

const formSchema = z.object({
  description: z.string().min(10, 'Please describe your idea in at least 10 characters.'),
  category: z.string().min(1, 'Please select a category.'),
});

export default function CustomizePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t = translations.customize_page;
  const { language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<{ imageUrl: string; predictedPrice: number } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const defaultImage = PlaceHolderImages.find(p => p.id === 'product-5');

  // Fetch buyer's profile to get shipping address and name
  const buyerProfileRef = useMemo(() => {
    if (user && firestore) {
      const ref = doc(firestore, 'users', user.uid);
      (ref as any).__memo = true;
      return ref;
    }
    return null;
  }, [user, firestore]);
  const { data: buyerProfile } = useDoc<{ name: string, location?: string }>(buyerProfileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      category: '',
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
            setIsListening(false);
            return;
        }
        console.error('Speech recognition error:', event.error);
        toast({ variant: 'destructive', title: t.voiceError, description: t.voiceErrorDesc });
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        form.setValue('description', transcript);
      };
    }
  }, [language, form, toast, t.voiceError, t.voiceErrorDesc]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: t.notSupported, description: t.notSupportedDesc });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  
  const handleGenerateImage = async () => {
    const { description, category } = form.getValues();
    if (!description || !category) {
        toast({
            variant: 'destructive',
            title: t.missingInfoToast,
            description: t.missingInfoDesc,
        });
        return;
    }
    
    setIsGenerating(true);
    setGeneratedDesign(null);
    try {
      const categoryObject = baseCategoriesData.find(c => c.id === category);
      const categoryName = categoryObject ? categoryObject.name : 'General';

      const result = await buyerAiDesignedProducts({
        prompt: description,
        style: categoryName,
        language: language,
      });
      setGeneratedDesign(result);
      toast({
        title: t.imageGeneratedToast,
        description: t.imageGeneratedDesc,
      });
    } catch (error) {
      console.error(error);
      setGeneratedDesign({ 
        imageUrl: defaultImage?.imageUrl || '',
        predictedPrice: 150
      });
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
    if (!generatedDesign) {
        toast({
            variant: 'destructive',
            title: t.noImageToast,
            description: t.noImageDesc,
        });
        return;
    }
     if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to send a request.' });
      return;
    }
    if (!buyerProfile?.location || buyerProfile?.location.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Address Missing',
        description: 'Please add a shipping address to your profile before sending a request.',
        action: <ToastAction altText="Go to profile" onClick={() => router.push('/buyer/profile')}>Go to Profile</ToastAction>,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const compressedGeneratedImage = await compressImage(generatedDesign.imageUrl);
      const requestsRef = collection(firestore, 'CustomizationRequest');
      
      const newRequest = {
        buyerId: user.uid,
        buyerName: buyerProfile.name || "Anonymous Buyer",
        buyerShippingAddress: buyerProfile.location,
        generatedImageUrl: compressedGeneratedImage,
        description: values.description,
        category: values.category,
        price: generatedDesign.predictedPrice,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
      };

      addDoc(requestsRef, newRequest)
        .then(() => {
          toast({
            title: t.requestSentToast,
            description: t.requestSentDesc,
          });
          form.reset();
          setGeneratedDesign(null);
        })
        .catch((error) => {
          const permissionError = new FirestorePermissionError({
            path: requestsRef.path,
            operation: 'create',
            requestResourceData: newRequest,
          });
          errorEmitter.emit('permission-error', permissionError);

          toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: error.message || 'Could not send your request. A permission error might have occurred.',
          });
        })
        .finally(() => {
            setIsSubmitting(false);
        });

    } catch (error: any) {
      console.error('Error preparing request:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not process the image before sending.',
      });
      setIsSubmitting(false);
    }
  }

  const getCategoryDisplayValue = (value: string) => {
    const category = baseCategoriesData.find(c => c.id === value);
    if (category) {
        const index = baseCategoriesData.indexOf(category);
        if (translations.product_categories.length > index) {
            return translations.product_categories[index];
        }
        return category.name;
    }
    return 'Select a category';
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => router.back()} variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t.backButton}
        </Button>
        <Link href="/buyer/customize-with-reference" passHref>
            <Button variant="secondary">
                <ImageIcon className="mr-2 h-4 w-4" />
                {t.referenceButton}
            </Button>
        </Link>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-2xl md:text-3xl">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.productDescriptionLabel}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        {...field}
                        placeholder={t.productDescriptionPlaceholder}
                        className="h-32 pr-12"
                      />
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleMicClick}
                        className={cn("absolute right-2 top-1/2 -translate-y-1/2", isListening && "bg-destructive text-destructive-foreground")}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.craftCategoryLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectCategoryPlaceholder}>
                                {getCategoryDisplayValue(field.value)}
                            </SelectValue>
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {baseCategoriesData.map((cat, index) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {translations.product_categories[index] || cat.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}/>

              <Button type="button" onClick={handleGenerateImage} disabled={isGenerating} className="w-full">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.generatingImageButton}</> : <><Sparkles className="mr-2 h-4 w-4" />{t.generateImageButton}</>}
              </Button>

              <div className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg bg-secondary overflow-hidden">
                {isGenerating ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                ) : generatedDesign?.imageUrl ? (
                    <>
                        <Image src={generatedDesign.imageUrl} alt="AI generated craft" fill className="object-cover"/>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white font-bold p-2 rounded-md text-lg">
                           ₹{generatedDesign.predictedPrice}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                        <Sparkles className="w-8 h-8 mb-2" />
                        <p className="text-sm font-semibold">{t.imagePlaceholder}</p>
                    </div>
                )}
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || !generatedDesign}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.sendingRequestButton}</> : <><Send className="mr-2 h-4 w-4" />{t.sendRequestButton}</>}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
