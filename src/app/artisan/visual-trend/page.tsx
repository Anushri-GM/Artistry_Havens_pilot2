
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { productCategories } from '@/lib/data';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';

const buyerCategoryData = [
  { category: "Pottery", buyers: 400, fill: "var(--color-chart-1)" },
  { category: "Jewelry", buyers: 300, fill: "var(--color-chart-2)" },
  { category: "Textiles", buyers: 278, fill: "var(--color-chart-3)" },
  { category: "Paintings", buyers: 189, fill: "var(--color-chart-4)" },
  { category: "Woodwork", buyers: 239, fill: "var(--color-chart-5)" },
  { category: "Sculpture", buyers: 200, fill: "var(--color-chart-1)" },
  { category: "Metalwork", buyers: 150, fill: "var(--color-chart-2)" },
];

const chartConfig = {
    buyers: {
      label: "Buyers",
    },
    ...productCategories.reduce((acc, cat, index) => ({
        ...acc,
        [cat]: {
            label: cat,
            color: `hsl(var(--chart-${index + 1}))`
        }
    }), {})
};

export default function VisualTrendPage() {
    const router = useRouter();
    const { translations } = useTranslation();
    const t = translations.artisan_home;

    return (
        <div className="container mx-auto p-4 pt-12">
             <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">{t.visualTrendTitle}</h1>
                    <p className="text-sm text-muted-foreground">{t.visualTrendDescription}</p>
                </div>
                <Button onClick={() => router.back()} variant="ghost" size="icon">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
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
                        <RadarChart data={buyerCategoryData}>
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
                                dot={{
                                    r: 4,
                                    fillOpacity: 1,
                                }}
                            />
                        </RadarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}

    