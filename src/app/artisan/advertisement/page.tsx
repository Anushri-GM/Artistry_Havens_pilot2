
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, Film, FileText, ChevronLeft, X, Save } from 'lucide-react';
import Image from 'next/image';
import { generateAdvertisement } from '@/ai/flows/generate-advertisement';
import { generateAdvertisementDescription } from '@/ai/flows/generate-advertisement-description';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/context/translation-context';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import type { SavedAdvertisement } from '@/lib/types';

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
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string; description: string } | null>(null);
  const [advertisementPrompt, setAdvertisementPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (imageFiles.length + files.length > 3) {
      setError('You can select a maximum of 3 photos.');
      toast({
        variant: 'destructive',
        title: 'Upload Limit Exceeded',
        description: 'You can only upload up to 3 images.',
      });
      return;
    }

    setError(null);
    setGeneratedVideo(null);
    
    const newFilePromises = Array.from(files).map(file => {
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

    Promise.all(newFilePromises)
      .then(newImages => {
        setImageFiles(prev => [...prev, ...newImages].slice(0, 3));
      })
      .catch(err => {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Error Reading Files',
          description: 'Could not process the selected image files.',
        });
      });
  };

  const handleGenerateDescription = async () => {
    if (imageFiles.length === 0) {
      setError('Please upload at least one photo to generate a description.');
      toast({
        variant: 'destructive',
        title: 'No Images Uploaded',
        description: 'Upload photos to create a relevant video description.',
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
        const { description } = await generateAdvertisementDescription({
            images: imageFiles.map(img => ({ url: img.dataUrl, contentType: img.contentType }))
        });
        setAdvertisementPrompt(description);
        toast({
            title: "Description Generated!",
            description: "Review the prompt and feel free to edit it."
        });
    } catch (err: any) {
        console.error(err);
        setError('Failed to generate description.');
        toast({
            variant: "destructive",
            title: "Description Generation Failed",
            description: err.message || "An unexpected error occurred."
        });
    } finally {
        setIsGeneratingDesc(false);
    }
  }

  const handleGenerateVideo = async () => {
    if (imageFiles.length === 0 || imageFiles.length > 3) {
      setError('Wrong number of photos uploaded. Please select between 1 and 3 photos.');
      return;
    }
    if (!advertisementPrompt) {
        setError('Please generate or write a description first.');
        return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setError(null);

    try {
      const result = await generateAdvertisement({
        prompt: advertisementPrompt,
        images: imageFiles.map(img => ({ url: img.dataUrl, contentType: img.contentType })),
      });
      
      setGeneratedVideo({
        url: result.videoUrl,
        description: result.description,
      });

      toast({
        title: 'Advertisement Generated!',
        description: 'Your video is ready to be viewed and saved below.',
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
      setIsGeneratingVideo(false);
    }
  };
  
  const handleClearImages = () => {
    setImageFiles([]);
    setGeneratedVideo(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleSaveAdvertisement = () => {
    if (!generatedVideo) return;
    setIsSaving(true);
    
    try {
        const savedAds: SavedAdvertisement[] = JSON.parse(localStorage.getItem('savedAdvertisements') || '[]');
        const newAd: SavedAdvertisement = {
            id: `ad-${Date.now()}`,
            videoUrl: generatedVideo.url,
            description: advertisementPrompt,
            createdAt: new Date().toISOString(),
        };
        savedAds.unshift(newAd);
        localStorage.setItem('savedAdvertisements', JSON.stringify(savedAds));

        toast({
            title: 'Advertisement Saved!',
            description: 'You can view it in your saved advertisements list.',
        });
    } catch (error) {
        console.error('Error saving advertisement:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Save',
            description: 'Could not save the advertisement.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-4 mt-12">
            <Button onClick={() => router.back()} variant="ghost" size="icon">
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-center">Generate Advertisement</h1>
            <div className="w-10"></div>
        </header>

        <div className="flex justify-end mb-4">
            <Link href="/artisan/advertisement/history" passHref>
                <Button variant="outline" className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300">View Advertisements</Button>
            </Link>
        </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardDescription>Upload 1 to 3 product photos to create a short video advertisement with AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Product Photos</Label>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isGeneratingVideo || imageFiles.length >= 3}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos ({imageFiles.length}/3)
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
            <div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                {imageFiles.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <Image src={file.dataUrl} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    </div>
                ))}
                </div>
                <Button onClick={handleClearImages} variant="destructive" size="sm" className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Clear Images
                </Button>
            </div>
          )}

          {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description-prompt" className="flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5" />
                Video Prompt
            </Label>
            <Textarea
                id="description-prompt"
                placeholder="Generate a description or write your own..."
                value={advertisementPrompt}
                onChange={(e) => setAdvertisementPrompt(e.target.value)}
                className="h-28"
            />
            <Button onClick={handleGenerateDescription} disabled={isGeneratingDesc || imageFiles.length === 0} className="w-full">
                {isGeneratingDesc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isGeneratingDesc ? 'Generating Description...' : 'Generate Description'}
            </Button>
          </div>

          <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo || imageFiles.length === 0 || !advertisementPrompt} className="w-full">
            {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
            {isGeneratingVideo ? 'Generating Video...' : 'Generate Advertisement'}
          </Button>

          {generatedVideo && (
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" />Generated Video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Button onClick={handleSaveAdvertisement} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Advertisement'}
                    </Button>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
