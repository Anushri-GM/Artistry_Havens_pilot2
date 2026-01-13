
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Check, X, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SponsorRequest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/context/translation-context';
import TutorialDialog from '@/components/tutorial-dialog';

const initialSponsorRequests: SponsorRequest[] = [
    {
      id: 'sponsor-1',
      name: 'ArtLover22',
      avatarUrl: 'https://picsum.photos/seed/sponsor1/100/100',
      monthlyContribution: 50,
      sharePercentage: 10,
      message: 'Love your work! Would be honored to support your journey.',
    },
    {
      id: 'sponsor-2',
      name: 'CreativeFund',
      avatarUrl: 'https://picsum.photos/seed/sponsor2/100/100',
      monthlyContribution: 100,
      sharePercentage: 15,
      message: 'We support emerging artists. Your portfolio is impressive.',
    },
];

export default function SponsorsPage() {
  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]);
  const [mySponsors, setMySponsors] = useState<SponsorRequest[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { translations } = useTranslation();
  const t = translations.sponsors_page;
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  useEffect(() => {
    const sponsorsFromStorage = JSON.parse(localStorage.getItem('mySponsors') || '[]');
    setMySponsors(sponsorsFromStorage);

    const requestsFromStorage = localStorage.getItem('sponsorRequests');
    if (requestsFromStorage) {
        const parsedRequests = JSON.parse(requestsFromStorage);
        setSponsorRequests(parsedRequests);
        if (parsedRequests.length > 0) {
            setOpenAccordionItems(prev => [...prev, 'requests']);
        }
    } else {
        setSponsorRequests(initialSponsorRequests);
        localStorage.setItem('sponsorRequests', JSON.stringify(initialSponsorRequests));
        if (initialSponsorRequests.length > 0) {
            setOpenAccordionItems(prev => [...prev, 'requests']);
        }
    }
  }, []);


  const handleAccept = (sponsorId: string) => {
    const sponsorToMove = sponsorRequests.find(req => req.id === sponsorId);
    
    if (sponsorToMove) {
        const updatedMySponsors = [...mySponsors, sponsorToMove];
        localStorage.setItem('mySponsors', JSON.stringify(updatedMySponsors));
        setMySponsors(updatedMySponsors);
    }
    
    const updatedRequests = sponsorRequests.filter(req => req.id !== sponsorId);
    setSponsorRequests(updatedRequests);
    localStorage.setItem('sponsorRequests', JSON.stringify(updatedRequests));

    toast({
      title: t.sponsorAcceptedToast,
      description: t.sponsorAcceptedToastDesc,
    });
  };

  const handleDecline = (sponsorId: string) => {
    const updatedRequests = sponsorRequests.filter(req => req.id !== sponsorId)
    setSponsorRequests(updatedRequests);
    localStorage.setItem('sponsorRequests', JSON.stringify(updatedRequests));
    toast({
      variant: 'destructive',
      title: t.sponsorDeclinedToast,
      description: t.sponsorDeclinedToastDesc,
    });
  };

  const handleTerminate = (sponsorId: string) => {
    const updatedSponsors = mySponsors.filter(sponsor => sponsor.id !== sponsorId);
    localStorage.setItem('mySponsors', JSON.stringify(updatedSponsors));
    setMySponsors(updatedSponsors);

    toast({
      variant: 'destructive',
      title: t.sponsorshipTerminatedToast,
      description: t.sponsorshipTerminatedToastDesc,
    });
  };

  const handleChat = (sponsorName: string) => {
    toast({
        title: t.chatToastTitle.replace('{sponsorName}', sponsorName),
        description: t.chatToastDesc,
    });
  }

  const renderRequests = () => {
      if (sponsorRequests.length === 0) {
        return (
            <Card className="flex items-center justify-center p-12 mt-6 border-none shadow-none bg-transparent">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg">{t.noRequestsTitle}</p>
                    <p>{t.noRequestsDescription}</p>
                </div>
            </Card>
        )
      }

      return (
        <div className="space-y-4 pt-4">
          {sponsorRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.avatarUrl} alt={request.name} />
                  <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{request.name}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold mb-1">{t.offering}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">₹{request.monthlyContribution}/month</Badge>
                    <Badge variant="secondary">{request.sharePercentage}% Revenue Share</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button onClick={() => handleAccept(request.id)} className="w-full">
                  <Check className="mr-2 h-4 w-4" /> {t.acceptButton}
                </Button>
                <Button onClick={() => handleDecline(request.id)} variant="outline" className="w-full">
                  <X className="mr-2 h-4 w-4" /> {t.declineButton}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
  }

  const renderMySponsors = () => {
    if (mySponsors.length === 0) {
        return (
            <Card className="flex items-center justify-center p-12 mt-6 border-none shadow-none bg-transparent">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg">{t.noSponsorsTitle}</p>
                    <p>{t.noSponsorsDescription}</p>
                </div>
            </Card>
        )
      }

      return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 pt-4">
          {mySponsors.map((sponsor) => (
            <Card key={sponsor.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4 pb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={sponsor.avatarUrl} alt={sponsor.name} />
                  <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                  <CardDescription>{t.sponsorshipActive}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">{t.contribution}: </span>
                   <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary">₹{sponsor.monthlyContribution}/month</Badge>
                        <Badge variant="secondary">{sponsor.sharePercentage}% Revenue Share</Badge>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">{sponsor.message}</p>
              </CardContent>
              <CardContent className="flex flex-col gap-2">
                 <Button onClick={() => handleChat(sponsor.name)} variant="outline" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" /> {t.chatButton}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <X className="mr-2 h-4 w-4" /> {t.terminateButton}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.terminateDialogTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.terminateDialogDescription.replace('{sponsorName}', sponsor.name)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleTerminate(sponsor.id)}>{t.terminateButton}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      <header className="mb-6 mt-12">
        <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </header>

      <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full space-y-4">
        <Card>
            <AccordionItem value="requests" className="border-b-0">
                <AccordionTrigger className="p-6 hover:no-underline text-lg font-semibold">
                    {t.requestsTab}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                    {renderRequests()}
                </AccordionContent>
            </AccordionItem>
        </Card>
        <Card>
            <AccordionItem value="my-sponsors" className="border-b-0">
                <AccordionTrigger className="p-6 hover:no-underline text-lg font-semibold">
                    {t.mySponsorsTab}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                    {renderMySponsors()}
                </AccordionContent>
            </AccordionItem>
        </Card>
      </Accordion>
    </div>
  );
}
