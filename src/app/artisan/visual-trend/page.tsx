
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { productCategories, categories as baseCategories } from '@/lib/data';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';

const buyerCategoryData = [
  { category: "Pottery", buyers: 400, fill: "var(--color-pottery)" },
  { category: "Jewelry", buyers: 300, fill: "var(--color-jewelry)" },
  { category: "Textiles", buyers: 278, fill: "var(--color-textiles)" },
  { category: "Paintings", buyers: 189, fill: "var(--color-paintings)" },
  { category: "Woodwork", buyers: 239, fill: "var(--color-woodwork)" },
  { category: "Sculpture", buyers: 200, fill: "var(--color-sculpture)" },
  { category: "Metalwork", buyers: 150, fill: "var(--color-metalwork)" },
];

const chartConfig = {
    buyers: {
      label: "Buyers",
    },
    ...baseCategories.reduce((acc, cat) => ({
        ...acc,
        [cat.name.toLowerCase()]: {
            label: cat.name,
            color: `hsl(var(--chart-${cat.id}))`
        }
    }), {})
};

export default function VisualTrendPage() {
    const router = useRouter();
    const { translations } = useTranslation();
    const t = translations.artisan_home;
    const { product_categories: translatedCategories } = translations;

    const translatedBuyerCategoryData = buyerCategoryData.map(item => {
        const index = productCategories.indexOf(item.category);
        return {
            ...item,
            category: index !== -1 ? translatedCategories[index] : item.category
        }
    });

    return (
        <div className="container mx-auto p-4 pt-12">
             <header className="mb-6 flex items-center justify-between">
                <div className="text-left">
                    <Button onClick={() => router.back()} variant="ghost" size="sm" className="-ml-4">
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="font-headline text-2xl font-bold mt-2">{t.visualTrendTitle}</h1>
                    <p className="text-sm text-muted-foreground">{t.visualTrendDescription}</p>
                </div>
            </header>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t.visualTrendTitle}</CardTitle>
                    <CardDescription>
                        {t.visualTrendDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square h-[300px] w-full"
                    >
                        <RadarChart data={translatedBuyerCategoryData}>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <PolarAngleAxis dataKey="category" />
                            <PolarGrid />
                            <Radar
                                dataKey="buyers"
                                fill="var(--color-buyers)"
                                fillOpacity={0.6}
                                dot={({ payload, ...rest }) => (
                                    <RechartsPrimitive.Dot
                                        {...rest}
                                        r={4}
                                        fillOpacity={1}
                                        fill={payload.fill}
                                    />
                                )}
                            />
                        </RadarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
