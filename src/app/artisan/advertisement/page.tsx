
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, Film, FileText, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { generateAdvertisement } from '@/ai/flows/generate-advertisement';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { artisans, productCategories } from '@/lib/data';
import { useTranslation } from '@/context/translation-context';
import { useRouter } from 'next/navigation';

interface ImageFile {
  name: string;
  dataUrl: string;
  contentType: string;
}

export default function AdvertisementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { translations } = useTranslation();
  
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [artisanName, setArtisanName] = useState('Artisan');
  const [artisanCategories, setArtisanCategories] = useState<string[]>([]);

  useEffect(() => {
    // In a real app, this data would come from the logged-in user's profile
    const storedProfile = localStorage.getItem('artisanProfile');
    if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setArtisanName(profile.name || artisans[0].name);
    } else {
        setArtisanName(artisans[0].name);
    }
    
    // For this example, we'll assign some default categories
    setArtisanCategories(productCategories.slice(0, 2));

  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (files.length === 0 || files.length > 3) {
      setError('Wrong number of photos uploaded. Please select between 1 and 3 photos.');
      setImageFiles([]);
      return;
    }

    setError(null);
    setGeneratedVideo(null); // Clear previous results
    
    const promises = Array.from(files).map(file => {
      return new Promise<ImageFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            dataUrl: e.target?.result as string,
            contentType: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(setImageFiles)
      .catch(err => {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Error Reading Files',
          description: 'Could not process the selected image files.',
        });
      });
  };

  const handleGenerate = async () => {
    if (imageFiles.length === 0 || imageFiles.length > 3) {
      setError('Wrong number of photos uploaded. Please select between 1 and 3 photos.');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setError(null);

    try {
      const result = await generateAdvertisement({
        artisanName,
        productCategories: artisanCategories,
        images: imageFiles.map(img => ({ url: img.dataUrl, contentType: img.contentType })),
      });
      
      setGeneratedVideo({
        url: result.videoUrl,
        description: result.description,
      });

      toast({
        title: 'Advertisement Generated!',
        description: 'Your video is ready to be viewed below.',
      });

    } catch (err: any) {
      console.error(err);
      setError('Failed to generate video. The AI model may be busy or an error occurred.');
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-4 mt-12">
            <Button onClick={() => router.back()} variant="ghost" size="icon">
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="font-headline text-2xl md:text-3xl font-bold">Generate Advertisement</h1>
            <div className="w-10"></div>
        </header>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardDescription>Upload 1 to 3 product photos to create a short video advertisement with AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isGenerating}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos (1-3)
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {imageFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                  <Image src={file.dataUrl} alt={`Preview ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleGenerate} disabled={isGenerating || imageFiles.length === 0} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGenerating ? 'Generating Video...' : 'Generate Advertisement'}
          </Button>

          {generatedVideo && (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Video Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{generatedVideo.description}</p>
                    </CardContent>
                </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" />Generated Video</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                        <video
                            key={generatedVideo.url}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            loop
                            muted
                        >
                            <source src={generatedVideo.url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    