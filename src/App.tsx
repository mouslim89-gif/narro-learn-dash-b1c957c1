import { useEffect } from"react";
import { QueryClient, QueryClientProvider } from"@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from"react-router-dom";
import { Toaster as Sonner } from"@/components/ui/sonner";
import { Toaster } from"@/components/ui/toaster";
import { TooltipProvider } from"@/components/ui/tooltip";
import { AnimatePresence, motion } from"framer-motion";
import { BottomNav } from"@/components/BottomNav";
import { AuthProvider, useAuth } from"@/contexts/AuthContext";
import { ProtectedRoute } from"@/components/ProtectedRoute";
import { useCloudSync } from"@/hooks/use-cloud-sync";
import { useReadingProgressStore } from"@/stores/reading-progress";
import { useFlashcardStore } from"@/stores/flashcards";
import Library from"./pages/Library";
import MyBooks from"./pages/MyBooks";
import Flashcards from"./pages/Flashcards";
import DictionaryPage from"./pages/Dictionary";
import WordDetail from"./pages/WordDetail";
import BookDetail from"./pages/BookDetail";
import Reader from"./pages/Reader";
import NotFound from"./pages/NotFound";
import Settings from"./pages/Settings";
import Auth from"./pages/Auth";
import ResetPassword from"./pages/ResetPassword";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";


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
 }, [darkMode]);
 return null;
}

function CloudSyncMount() {
 useCloudSync();
 return null;
}

function AnimatedRoutes() {
 const location = useLocation();
 const { user, loading } = useAuth();
 const isReviewing = useFlashcardStore(s => s.isReviewing);
 const isAuthRoute = location.pathname ==='/auth'|| location.pathname ==='/reset-password';
 const path = location.pathname;
  const isDetailRoute =
  path.startsWith('/reader/') ||
  path.startsWith('/book/') ||
  path === '/welcome' ||
  path === '/onboarding' ||
  (path.startsWith('/dictionary/') && path !=='/dictionary') ||
  path ==='/settings';

 const hideNav = isDetailRoute || isReviewing || isAuthRoute;
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
  <Route path="/welcome" element={<Welcome />} />
  <Route path="/auth"element={<Auth />} />
  <Route path="/reset-password"element={<ResetPassword />} />
  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
  <Route path="/"element={<ProtectedRoute><Library /></ProtectedRoute>} />
  <Route path="/my-books"element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
  <Route path="/flashcards"element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
  <Route path="/dictionary"element={<ProtectedRoute><DictionaryPage /></ProtectedRoute>} />
  <Route path="/dictionary/:word"element={<ProtectedRoute><WordDetail /></ProtectedRoute>} />
  <Route path="/book/:id"element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
  <Route path="/reader/:id/:difficulty"element={<ProtectedRoute><Reader /></ProtectedRoute>} />
  <Route path="/reader/:id/:difficulty/:chapterId"element={<ProtectedRoute><Reader /></ProtectedRoute>} />
  <Route path="/settings"element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
 <DarkModeSync />
 <CloudSyncMount />
 <AnimatedRoutes />
 </AuthProvider>
 </BrowserRouter>
 </TooltipProvider>
 </QueryClientProvider>
);

export default App;
