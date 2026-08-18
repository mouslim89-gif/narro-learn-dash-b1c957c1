import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SplashScreen } from "@/components/SplashScreen";
import { DictionaryPreloader } from "@/components/DictionaryPreloader";
import { useOnboardingStore } from "@/stores/onboarding";
import { initializeNativePlatform, updateNativeStatusBar } from "@/lib/native";

import { useCloudSync } from "@/hooks/use-cloud-sync";
import { useSubscriptionSync } from "@/hooks/use-premium";

import { useReadingProgressStore } from "@/stores/reading-progress";
import { useFlashcardStore } from "@/stores/flashcards";
import Library from"./pages/Library";
import MyBooks from"./pages/MyBooks";
import Flashcards from"./pages/Flashcards";
import DictionaryPage from"./pages/Dictionary";
import WordDetail from"./pages/WordDetail";
import BookDetail from"./pages/BookDetail";
import Reader from"./pages/Reader";
import NotFound from"./pages/NotFound";
import Settings from"./pages/Settings";
import GrammarDetail from"./pages/GrammarDetail";
import Auth from"./pages/Auth";

import ResetPassword from"./pages/ResetPassword";
import Terms from"./pages/Terms";
import Privacy from"./pages/Privacy";
import Credits from"./pages/Credits";
import Support from"./pages/Support";
import AccountDeletion from"./pages/AccountDeletion";
import Premium from"./pages/Premium";


const queryClient = new QueryClient();

const pageVariants = {
 initial: { opacity: 0 },
 animate: { opacity: 1 },
 exit: { opacity: 0 },
};

// Apple-like spring easing (matches --ease-out-soft in index.css)
const pageTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

function DarkModeSync() {
 const darkMode = useReadingProgressStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    updateNativeStatusBar(darkMode);
  }, [darkMode]);
  return null;
}

function NativeInitializer() {
  const darkMode = useReadingProgressStore((s) => s.darkMode);
  useEffect(() => {
    initializeNativePlatform(darkMode);
  }, []);
  return null;
}

function MotionPreference({ children }: { children: React.ReactNode }) {
  const disableAnimation = useOnboardingStore((s) => s.disableAnimation);

  useEffect(() => {
    document.documentElement.classList.toggle("no-anim", disableAnimation);
  }, [disableAnimation]);

  return (
    <MotionConfig
      reducedMotion={disableAnimation ? "always" : "user"}
      transition={disableAnimation ? { duration: 0 } : undefined}
    >
      {children}
    </MotionConfig>
  );
}

function CloudSyncMount() {
 useCloudSync();
 useSubscriptionSync();
 return null;
}


function AnimatedRoutes() {
 const location = useLocation();
 const { user, loading } = useAuth();
 const isReviewing = useFlashcardStore(s => s.isReviewing);
 const isAuthRoute = location.pathname ==='/auth'|| location.pathname ==='/reset-password';
 const isLegalRoute = ['/terms','/privacy','/credits','/support','/account-deletion'].includes(location.pathname);
 const path = location.pathname;
 const isDetailRoute =
 path.startsWith('/reader/') ||
 path.startsWith('/book/') ||
 (path.startsWith('/dictionary/') && path !=='/dictionary') ||
 path.startsWith('/grammar/') ||
 path ==='/premium'||
 path ==='/settings';


 const hideNav = isDetailRoute || isReviewing || isAuthRoute || isLegalRoute;
 const shouldWaitForPageTransition = !loading && !!user && !isAuthRoute;

 return (
 <>
 <div className="relative">
 <AnimatePresence mode={shouldWaitForPageTransition ?"wait":"popLayout"} initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
 <motion.div
 key={location.pathname}
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 transition={pageTransition}
 className="w-full bg-background min-h-screen"
 >
 <Routes location={location}>
 <Route path="/auth"element={<Auth />} />
 <Route path="/reset-password"element={<ResetPassword />} />
 <Route path="/terms"element={<Terms />} />
 <Route path="/privacy"element={<Privacy />} />
 <Route path="/credits"element={<Credits />} />
 <Route path="/support"element={<Support />} />
 <Route path="/account-deletion"element={<AccountDeletion />} />
 <Route path="/"element={<ProtectedRoute><Library /></ProtectedRoute>} />
 <Route path="/my-books"element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
 <Route path="/flashcards"element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
 <Route path="/dictionary"element={<ProtectedRoute><DictionaryPage /></ProtectedRoute>} />
 <Route path="/dictionary/:word"element={<ProtectedRoute><WordDetail /></ProtectedRoute>} />
 <Route path="/book/:id"element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
 <Route path="/reader/:id/:difficulty"element={<ProtectedRoute><Reader /></ProtectedRoute>} />
 <Route path="/reader/:id/:difficulty/:chapterId"element={<ProtectedRoute><Reader /></ProtectedRoute>} />
 <Route path="/grammar/:id"element={<ProtectedRoute><GrammarDetail /></ProtectedRoute>} />
 <Route path="/settings"element={<ProtectedRoute><Settings /></ProtectedRoute>} />
  <Route path="/premium"element={<ProtectedRoute><Premium /></ProtectedRoute>} />

 <Route path="*"element={<NotFound />} />
 </Routes>
 </motion.div>
 </AnimatePresence>
 </div>
 {!hideNav && <BottomNav />}
 </>
 );
}

const App = () => (
 <QueryClientProvider client={queryClient}>
 <TooltipProvider>
 <Toaster />
 <Sonner />
 <BrowserRouter>
 <AuthProvider>
   <MotionPreference>
    <DarkModeSync />
    <NativeInitializer />
    <CloudSyncMount />
    <SplashScreen />
    <OnboardingCarousel />
    <DictionaryPreloader />
    <AnimatedRoutes />
   </MotionPreference>
 </AuthProvider>
 </BrowserRouter>

 </TooltipProvider>
 </QueryClientProvider>
);

export default App;
