
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import 'regenerator-runtime/runtime';
import {
  User,
  Package,
  HeartHandshake,
  MessageCircleQuestion,
  ShoppingBag,
  Bookmark,
  LogOut,
  Bell,
  DollarSign,
  X,
  Mic,
  BarChart,
  LayoutDashboard,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import SupportDialog from './support-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/context/translation-context';
import { useLanguage } from '@/context/language-context';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { interpretNavCommand } from '@/ai/flows/interpret-navigation-command';
import { useUser, useFirestore, useAuth, useCollection } from '@/firebase';
import { doc, getDoc, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { Notification } from '@/lib/types';


export function HeaderActions() {
    const { translations } = useTranslation();
    const { language } = useLanguage();
    const router = useRouter();
    const { toast } = useToast();
    const t_notifications = translations.artisan_sidebar.notifications;
    const t_sidebar = translations.artisan_sidebar;
    const auth = useAuth();
    
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [spokenCommand, setSpokenCommand] = useState<string | null>(null);
    
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemo(() => {
        if (user && firestore) {
          const q = query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc')
          );
          (q as any).__memo = true;
          return q;
        }
        return null;
      }, [user, firestore]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);
    
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            toast({
                title: t_sidebar.logoutToastTitle,
                description: t_sidebar.logoutToastDesc
            });
            router.push('/');
        } catch (error) {
            console.error("Logout failed", error);
            toast({
                variant: 'destructive',
                title: "Logout Failed",
                description: "An error occurred while logging out."
            });
        }
    }, [auth, router, toast, t_sidebar.logoutToastDesc, t_sidebar.logoutToastTitle]);

    // Setup speech recognition only once.
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            // No toast notifications will be shown for any voice error.
        };

        recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript;
            if (command) {
                setSpokenCommand(command);
            }
        };

    }, [toast, t_sidebar.voiceErrorDesc, t_sidebar.voiceErrorTitle, t_sidebar.voiceNetworkErrorDesc, t_sidebar.voiceNetworkErrorTitle]);

    useEffect(() => {
        if (!spokenCommand) {
            return;
        }
        
        setIsProcessing(true); // Mark as processing

        const processCommand = async () => {
            
            try {
                const recognition = recognitionRef.current;
                const { page } = await interpretNavCommand({ command: spokenCommand, language: recognition.lang });
                
                if (page && page !== 'unknown') {
                    if (page === 'logout') {
                        toast({ title: t_sidebar.loggingOut, description: t_sidebar.willBeSignedOut });
                        await handleLogout();
                    } else {
                        const path = page === 'home' ? '/artisan/home' : `/artisan/${page}`;
                        toast({ title: t_sidebar.navigating, description: t_sidebar.navigatingTo.replace('{page}', page.replace(/-/g, ' '))});
                        router.push(path);
                    }
                } else {
                    console.warn("Navigation failed: command not understood.");
                }
            } catch (error) {
                console.error('AI navigation error:', error);
            } finally {
                setSpokenCommand(null); // Reset command after processing
                setIsProcessing(false); // Finish processing
            }
        };

        processCommand();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spokenCommand, router, handleLogout]);

    const toggleListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice commands are not supported on this browser.' });
            return;
        }
        if (isListening || isProcessing) {
            recognition.stop();
        } else {
            // Set language just before starting
            recognition.lang = language; 
            recognition.start();
        }
    }, [isListening, isProcessing, language, toast]);


    const handleNotificationClick = (notification: Notification) => {
        if (!user || !firestore) return;
    
        // Navigate to the link associated with the notification
        router.push(notification.link);
    
        // Delete the notification from the subcollection
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        deleteDoc(notifRef).catch(err => {
            console.error("Failed to delete notification: ", err);
        });
    };

    return (
        <div className="flex items-center gap-1">
             <Button
                variant="ghost"
                size="icon"
                aria-label="Voice Command"
                className={cn("relative rounded-full", (isListening || isProcessing) && "bg-destructive text-destructive-foreground animate-pulse")}
                onClick={toggleListening}
            >
                <Mic className="h-5 w-5" />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Notifications"
                        className="relative rounded-full"
                    >
                        <Bell className="h-5 w-5" />
                        {notifications && notifications.length > 0 && (
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>{t_notifications.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications && notifications.length > 0 ? (
                        notifications.map((n) => (
                            <DropdownMenuItem key={n.id} onSelect={() => handleNotificationClick(n)} className="flex items-start gap-2 cursor-pointer">
                                <div>
                                    <p className="font-semibold">{n.title}</p>
                                    <p className="text-xs text-muted-foreground">{n.message}</p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">{t_notifications.noNotifications}</p>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <SupportDialog>
              <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Support"
                  className="rounded-full"
              >
                  <MessageCircleQuestion className="h-5 w-5" />
              </Button>
            </SupportDialog>
        </div>
    )
}

interface ArtisanSidebarProps {
  closeSheet?: () => void;
}

export default function ArtisanSidebar({ closeSheet }: ArtisanSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { translations } = useTranslation();
    const t = translations.artisan_sidebar;
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    
    const [artisanProfile, setArtisanProfile] = useState<{name: string, avatarUrl: string | null}>({
      name: 'Artisan',
      avatarUrl: null,
    });

    useEffect(() => {
        async function fetchProfile() {
            if (user && firestore) {
                const userRef = doc(firestore, 'users', user.uid);
                try {
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setArtisanProfile({
                            name: data.name || 'Artisan',
                            avatarUrl: data.avatarUrl || null,
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile for sidebar:", error);
                }
            }
        }
        
        if (!isUserLoading) {
            fetchProfile();
        }
    }, [user, isUserLoading, firestore]);

    const baseNavItems = {
        studio: [
            { href: '/artisan/home', icon: TrendingUp, labelKey: 'trends' },
            { href: '/artisan/my-products', icon: ShoppingBag, labelKey: 'myProducts' },
            { href: '/artisan/saved-collection', icon: Bookmark, labelKey: 'savedCollection' },
        ],
        business: [
            { href: '/artisan/dashboard', icon: DollarSign, labelKey: 'revenue' },
            { href: '/artisan/orders', icon: Package, labelKey: 'orders' },
            { href: '/artisan/statistics', icon: BarChart, labelKey: 'statistics' },
            { href: '/artisan/sponsors', icon: HeartHandshake, labelKey: 'sponsors' },
        ]
    };

    const handleLinkClick = (href: string) => {
        router.push(href);
        if (closeSheet) {
          closeSheet();
        }
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await signOut(auth);
            if (closeSheet) closeSheet();
            toast({
                title: t.logoutToastTitle,
                description: t.logoutToastDesc
            });
            router.push('/');
        } catch (error) {
            console.error("Logout failed", error);
            toast({
                variant: 'destructive',
                title: "Logout Failed",
                description: "An error occurred while logging out."
            });
        }
    };
    
    const isLinkActive = (href: string) => {
        if (href.endsWith('/sponsors')) {
            return pathname.startsWith('/artisan/sponsors');
        }
        return pathname === href;
    };

    return (
        <div className="flex h-full max-h-screen flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4 lg:h-[60px]">
                <button onClick={() => handleLinkClick('/artisan/home')} className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6 text-primary lg:h-8 lg:w-8" />
                    <span className="font-headline text-lg lg:text-xl">Artistry Havens</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="flex h-full flex-col p-4">
                    <div className="flex-1 space-y-6">
                        
                        <div>
                            <h3 className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/60">{t.studio}</h3>
                            <ul className="space-y-1 mt-2">
                                {baseNavItems.studio.map((item) => (
                                <li key={item.labelKey}>
                                    <button
                                        onClick={() => handleLinkClick(item.href)}
                                        className={cn(
                                            'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground/80 transition-all hover:text-primary hover:bg-sidebar-accent',
                                            isLinkActive(item.href) && 'bg-sidebar-accent text-primary font-semibold'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {t.navItems[item.labelKey]}
                                    </button>
                                </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/60">{t.businessTools}</h3>
                            <ul className="space-y-1 mt-2">
                                {baseNavItems.business.map((item) => (
                                <li key={item.labelKey}>
                                    <button
                                        onClick={() => handleLinkClick(item.href)}
                                        className={cn(
                                            'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground/80 transition-all hover:text-primary hover:bg-sidebar-accent',
                                            isLinkActive(item.href) && 'bg-sidebar-accent text-primary font-semibold'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {t.navItems[item.labelKey]}
                                    </button>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-auto -mx-4 border-t border-sidebar-border">
                        <div className="flex items-center justify-between p-4">
                            <button onClick={() => handleLinkClick('/artisan/profile')} className="flex items-center gap-3 w-full">
                                <Avatar className="h-9 w-9">
                                    {artisanProfile.avatarUrl && <AvatarImage src={artisanProfile.avatarUrl} alt={artisanProfile.name} />}
                                    <AvatarFallback>{artisanProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">{artisanProfile.name}</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-sidebar-foreground/60 hover:text-primary"
                                aria-label="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
}
