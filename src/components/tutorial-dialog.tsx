
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Film, BookOpen } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';

interface Tutorial {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
}

const tutorials: Tutorial[] = [
  {
    id: 'add-product',
    title: 'How to Add a Product',
    videoUrl: 'https://ik.imagekit.io/u92ylzrua/Add-product.mp4?updatedAt=1762087122479',
    description: "Learn how to upload a photo and use AI to generate your product details in just a few clicks."
  },
  {
    id: 'my-products',
    title: 'Managing Your Products',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: "An overview of how to view, edit, and delete your product listings from the 'My Products' page."
  },
  {
    id: 'orders',
    title: 'Managing Orders',
    videoUrl: 'https://ik.imagekit.io/u92ylzrua/Orders.mp4?updatedAt=1762100559448',
    description: "Learn how to accept new order requests and update the status of ongoing orders from processing to delivery."
  },
  {
    id: 'dashboard',
    title: 'Understanding Your Revenue',
    videoUrl: 'https://ik.imagekit.io/u92ylzrua/Revenue_Finance.mp4?updatedAt=1762100675221',
    description: "A quick guide to your revenue dashboard, including how to track earnings and revenue shared with sponsors."
  },
  {
    id: 'sponsors',
    title: 'Managing Sponsors',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    description: "Learn how to review sponsor requests and manage your active sponsorships."
  },
  {
    id: 'statistics',
    title: 'Analyzing Your Performance',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    description: "Discover how to use the statistics page to track likes vs. sales and get AI-powered insights on your products."
  },
  {
    id: 'saved-collection',
    title: 'Using Saved Collections',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    description: "Learn how to save inspiring products from the 'Trends' page into collections for future reference."
  },
  {
    id: 'profile',
    title: 'Editing Your Profile',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    description: "A walkthrough on how to update your public-facing artisan profile and manage your personal details."
  },
  {
    id: 'home',
    title: 'Exploring Trends',
    videoUrl: 'https://ik.imagekit.io/6dbfqmlzz/download%20(2).mp4?updatedAt=1761487760209',
    description: "Learn how to discover popular products, save them for inspiration, and get AI-powered reviews on your own ideas."
  },
];

interface TutorialDialogProps {
  children?: React.ReactNode;
  pageId: string;
}

export default function TutorialDialog({ pageId, children }: TutorialDialogProps) {
  const tutorial = tutorials.find(t => t.id === pageId);
  const { translations } = useTranslation();
  const t = translations.tutorial_dialog;


  if (!tutorial) {
    return children || null;
  }
  
  const trigger = children ? (
     <DialogTrigger asChild>{children}</DialogTrigger>
  ) : (
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="bg-blue-500 text-white hover:bg-blue-600 absolute top-4 right-4 z-10">
          <BookOpen className="mr-2 h-4 w-4" />
          {t.tutorial}
        </Button>
      </DialogTrigger>
  );

  return (
    <Dialog>
      {trigger}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tutorial.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="aspect-[9/16] w-full bg-muted rounded-lg overflow-hidden">
            <video
              key={tutorial.id}
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
            >
              <source src={tutorial.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{tutorial.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    



