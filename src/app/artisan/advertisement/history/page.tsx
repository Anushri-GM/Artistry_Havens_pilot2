
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Download, Trash2, VideoOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/translation-context';
import type { SavedAdvertisement } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdvertisementHistoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { translations } = useTranslation();
  
  const [savedAds, setSavedAds] = useState<SavedAdvertisement[]>([]);
  const [adToDelete, setAdToDelete] = useState<SavedAdvertisement | null>(null);

  useEffect(() => {
    const adsFromStorage = JSON.parse(localStorage.getItem('savedAdvertisements') || '[]');
    setSavedAds(adsFromStorage);
  }, []);

  const formatTimeAgo = (date: string) => {
    try {
      const distance = formatDistanceToNow(new Date(date));
      return `Generated ${distance} ago`;
    } catch (e) {
      return 'Generated recently';
    }
  }

  const handleDelete = () => {
    if (!adToDelete) return;
    const updatedAds = savedAds.filter(ad => ad.id !== adToDelete.id);
    setSavedAds(updatedAds);
    localStorage.setItem('savedAdvertisements', JSON.stringify(updatedAds));
    toast({
        title: "Advertisement Deleted",
        description: "The advertisement has been removed from your history."
    });
    setAdToDelete(null);
  };
  
  const handleDownload = (videoUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
          title: "Download Started",
          description: "Your video is being downloaded."
      })
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-4 mt-12">
        <Button onClick={() => router.back()} variant="ghost" size="icon">
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Saved Advertisements</h1>
        <div className="w-10"></div>
      </header>

      {savedAds.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {savedAds.map((ad) => (
            <Card key={ad.id} className="w-full mx-auto shadow-lg">
              <CardContent className="p-4">
                <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden mb-4">
                  <video key={ad.videoUrl} className="w-full h-full object-cover" controls loop muted>
                    <source src={ad.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <CardDescription className="text-xs">{formatTimeAgo(ad.createdAt)}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{ad.description}</p>
              </CardContent>
              <CardContent className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => handleDownload(ad.videoUrl, `${ad.id}.mp4`)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your advertisement.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setAdToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete()}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-12">
            <VideoOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Saved Advertisements</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                You haven't saved any generated advertisements yet.
            </p>
        </Card>
      )}

      <AlertDialog open={!!adToDelete} onOpenChange={(open) => !open && setAdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your advertisement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
