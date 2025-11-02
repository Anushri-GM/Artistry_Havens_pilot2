
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { products } from "@/lib/data";
import Image from "next/image";
import { useTranslation } from "@/context/translation-context";

// Mock data for sponsored products and revenue
const sharedRevenueData = [
  {
    ...products[1],
    sharedAmount: 225,
    artisanShare: '15%',
  },
  {
    ...products[2],
    sharedAmount: 180,
    artisanShare: '20%',
  },
];

export default function RevenuePage() {
    const { translations } = useTranslation();
    const t = translations.sponsor_revenue_page;

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="font-headline text-3xl font-bold">{t.mainTitle}</h1>
        <p className="text-md text-muted-foreground">{t.mainDescription}</p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.sharedRevenueTitle}</CardTitle>
            <CardDescription>
              {t.sharedRevenueDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px]">{t.productHeader}</TableHead>
                    <TableHead>{t.artisanHeader}</TableHead>
                    <TableHead>{t.artisanShareHeader}</TableHead>
                    <TableHead className="text-right">{t.sharedAmountHeader}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sharedRevenueData.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                        <Image
                            src={item.image.url}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover aspect-square"
                        />
                        </TableCell>
                        <TableCell className="font-medium">{item.artisan.name}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{item.artisanShare}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">₹{item.sharedAmount.toFixed(2)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
