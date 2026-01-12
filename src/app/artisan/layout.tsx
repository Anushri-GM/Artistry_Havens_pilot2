
'use client';

import ArtisanSidebar, { HeaderActions } from '@/components/artisan-sidebar';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PanelLeft, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function ArtisanLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const noSidebarRoutes = ['/artisan/register', '/artisan/category-selection', '/artisan/post-auth', '/artisan/register-recovery'];
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const isProfileSetupPage = pathname === '/artisan/profile' && searchParams.get('setup') === 'true';
  const showAddProductButton = !pathname.startsWith('/artisan/add-product') && !isProfileSetupPage;

  if (noSidebarRoutes.includes(pathname)) {
    return <main className="h-full overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
              <ArtisanSidebar closeSheet={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <HeaderActions />
      </header>
      <main className="flex-1 overflow-y-auto bg-muted/40 relative">
        {children}
        {showAddProductButton && (
          <Link href="/artisan/add-product" passHref>
            <Button
              size="icon"
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 hover:bg-primary/90"
              aria-label="Add New Product"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </Link>
        )}
      </main>
    </div>
  );
}

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <ArtisanLayoutContent>{children}</ArtisanLayoutContent>
    </Suspense>
  );
}
