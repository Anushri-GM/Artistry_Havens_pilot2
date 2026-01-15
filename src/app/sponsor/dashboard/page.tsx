
'use client';

import { products, categories as baseCategories, artisans } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { Product, Artisan, Category } from "@/lib/types";
import { useState, useEffect } from 'react';
import Link from "next/link";
import { useTranslation } from "@/context/translation-context";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Autoplay from "embla-carousel-autoplay";

export default function SponsorDashboardPage() {
  const { toast } = useToast();
  const { translations } = useTranslation();
  const t = translations.sponsor_dashboard_page;

  const categories = baseCategories.map((category, index) => ({
    ...category,
    name: translations.product_categories[index] || category.name,
  }));

  const featuredArtisans = artisans.slice(0, 5);

  const artisansByCategory = (categoryName: string): Artisan[] => {
    // Find all unique artisans for a given product category
    const artisanIds = new Set<string>();
    products.forEach(p => {
        if (p.category === categoryName) {
            artisanIds.add(p.artisan.id);
        }
    });
    return artisans.filter(a => artisanIds.has(a.id));
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <header className="mb-6 text-center">
        <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
        <p className="text-md text-muted-foreground max-w-lg mx-auto">{t.description}</p>
      </header>

      {/* Featured Artisans Carousel */}
      <section className="mb-10">
        <h2 className="font-headline text-2xl font-semibold mb-4 text-center">Featured Artisans</h2>
        <Carousel
            opts={{ align: 'start', loop: true }}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
            className="w-full max-w-xs sm:max-w-sm mx-auto"
        >
            <CarouselContent className="-ml-4">
                {featuredArtisans.map((artisan) => (
                    <CarouselItem key={artisan.id} className="pl-4">
                        <Link href={`/sponsor/product/${products.find(p => p.artisan.id === artisan.id)?.id || ''}`} passHref>
                           <Card className="overflow-hidden">
                                <div className="relative aspect-video">
                                     <Image 
                                        src={products.find(p => p.artisan.id === artisan.id)?.image.url || ''} 
                                        alt={`${artisan.name}'s work`} 
                                        fill 
                                        className="object-cover"
                                     />
                                </div>
                                <CardContent className="p-4 flex items-center gap-4">
                                     <Avatar className="h-12 w-12 border-2 border-primary">
                                         <AvatarImage src={artisan.avatar.url} alt={artisan.name} />
                                         <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <div>
                                         <p className="font-semibold">{artisan.name}</p>
                                         <p className="text-xs text-muted-foreground">{artisan.crafts?.join(', ')}</p>
                                     </div>
                                </CardContent>
                           </Card>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      <section className="my-10">
        <h2 className="font-headline text-2xl font-semibold mb-6 text-center">{t.discoverTitle}</h2>
        <div className="space-y-8">
          {categories.map((category) => {
            const originalCategory = baseCategories.find(c => c.id === category.id);
            if (!originalCategory) return null;

            const categoryArtisans = artisansByCategory(originalCategory.name);
            if (categoryArtisans.length === 0) return null;

            return (
              <div key={category.id}>
                <h3 className="font-headline text-xl font-semibold mb-4 flex items-center gap-2"><category.icon className="h-5 w-5 text-primary" /> {category.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-4">
                  {categoryArtisans.map(artisan => {
                     const artisanProduct = products.find(p => p.artisan.id === artisan.id && p.category === originalCategory.name);
                     if (!artisanProduct) return null;

                     return(
                        <Link href={`/sponsor/product/${artisanProduct.id}`} passHref key={artisan.id}>
                            <Card className="overflow-hidden group h-full flex flex-col">
                                <div className="relative aspect-[4/3] w-full">
                                <Image
                                    src={artisanProduct.image.url}
                                    alt={artisanProduct.name}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                                </div>
                                <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground font-headline truncate">{artisan.name}</h4>
                                        <p className="text-xs text-muted-foreground">{t.specializesIn} {category.name}</p>
                                    </div>
                                    <Button size="sm" variant="secondary" className="w-full mt-3">{t.viewArtisanButton}</Button>
                                </CardContent>
                            </Card>
                        </Link>
                     )
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
