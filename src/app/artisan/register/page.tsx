
'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { useTranslation } from '@/context/translation-context';
import { useLanguage } from '@/context/language-context';
import { signInWithPhoneNumber, type ConfirmationResult, RecaptchaVerifier, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  otp: z.string().length(6, 'OTP must be 6 digits.').optional(),
});

export default function ArtisanRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { translations } = useTranslation();
  const { language } = useLanguage();
  const t = translations.artisan_register_page;
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: '',
      otp: '',
    },
  });

  const handleSendOtp = useCallback(async () => {
    const { mobileNumber } = form.getValues();
    const mobileResult = z.string().regex(/^\d{10}$/).safeParse(mobileNumber);

    if (!mobileResult.success) {
      form.setError('mobileNumber', { message: t.invalidNumber });
      return;
    }

    // Bypass for test number
    if (mobileNumber === '8438610450') {
        form.setValue('otp', '123456');
        setOtpSent(true);
        toast({
            title: "Test OTP Entered",
            description: "Using pre-filled test OTP for the test number.",
        });
        return;
    }
   
    setIsLoading(true);
    auth.languageCode = language;
    const phoneNumber = `+91${mobileNumber}`;

    try {
        if (!recaptchaContainerRef.current) {
            throw new Error("reCAPTCHA container not found.");
        }
        
        // Ensure the container is empty before creating a new verifier
        recaptchaContainerRef.current.innerHTML = '';

        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible'
        });

        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({
            title: t.otpSentToast,
            description: t.otpSentToastDesc,
        });
    } catch (error: any) {
      console.error("signInWithPhoneNumber error:", error);
      toast({
        variant: 'destructive',
        title: t.errorSendingOtp,
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }, [auth, form, language, t.invalidNumber, t.otpSentToast, t.otpSentToastDesc, toast, t.errorSendingOtp]);

  const saveUserData = async (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        phone: user.phoneNumber,
        role: 'artisan',
        createdAt: serverTimestamp(),
    }, { merge: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!otpSent || !values.otp || values.otp.length !== 6) {
      form.setError('otp', { message: 'OTP must be 6 digits.' });
      return;
    }

    setIsLoading(true);
    // Test number bypass
    if (values.mobileNumber === '8438610450' && values.otp === '123456') {
        toast({
            title: t.welcomeToast,
            description: t.accountCreatedDesc,
        });
        localStorage.setItem('tempPhone', values.mobileNumber);
        setIsLoading(false);
        router.push('/artisan/profile?setup=true');
        return;
    }

    if (!confirmationResult) {
        toast({ variant: 'destructive', title: 'Error', description: 'OTP confirmation context is missing.' });
        setIsLoading(false);
        return;
    }

    try {
      const result = await confirmationResult.confirm(values.otp);
      const user = result.user;
      
      const isNewUser = (user.metadata.creationTime === user.metadata.lastSignInTime);
      
      // Save user data to Firestore
      await saveUserData(user);

      toast({
        title: isNewUser ? t.welcomeToast : t.welcomeBackToast,
        description: isNewUser ? t.accountCreatedDesc : t.welcomeBackToastDesc,
      });
      
      if (isNewUser) {
        localStorage.setItem('tempPhone', values.mobileNumber);
        router.push('/artisan/profile?setup=true');
      } else {
        router.push('/artisan/post-auth');
      }

    } catch (error: any) {
        console.error("OTP verification error:", error);
        if (error.code === 'auth/code-expired') {
             toast({
                variant: 'destructive',
                title: t.otpExpiredToast,
                description: t.otpExpiredToastDesc,
            });
            setOtpSent(false); // Allow user to request a new OTP
            form.resetField('otp');
        } else {
            toast({
                variant: 'destructive',
                title: t.invalidOtpToast,
                description: error.message || t.invalidOtpToastDesc,
            });
        }
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-xs shadow-lg">
        <CardHeader className="text-center">
            <Link href="/role-selection" className="flex justify-center mb-4">
                <Logo className="h-10 w-10 text-primary" />
            </Link>
          <CardTitle className="font-headline text-xl">{t.title}</CardTitle>
          <CardDescription className="text-sm">
            {t.description}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.mobileLabel}</FormLabel>
                        <FormControl>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-sm text-muted-foreground">+91</span>
                          <Input placeholder={t.mobilePlaceholder} {...field} disabled={otpSent} className="text-sm rounded-l-none" />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              
              {otpSent ? (
                 <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.otpLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.otpPlaceholder} {...field} disabled={!otpSent || isLoading} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </CardContent>
            <CardContent>
              {otpSent ? (
                <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.verifyButton}
                    </Button>
                    <Button type="button" variant="link" className="text-xs p-0 h-auto w-full" onClick={handleSendOtp} disabled={isLoading}>
                        {t.resendOtp}
                    </Button>
                </div>
              ) : (
                <Button type="button" className="w-full" onClick={handleSendOtp} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.sendOtpButton}
                </Button>
              )}
            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex flex-col justify-center text-xs text-muted-foreground">
          <div ref={recaptchaContainerRef} className="my-2"></div>
          <Button variant="link" className="text-xs p-0 h-auto">{t.termsAndConditions}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
