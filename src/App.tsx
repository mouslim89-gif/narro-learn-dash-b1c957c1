import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useReadingProgressStore } from "@/stores/reading-progress";
import { useFlashcardStore } from "@/stores/flashcards";
import Library from "./pages/Library";
import MyBooks from "./pages/MyBooks";
import Flashcards from "./pages/Flashcards";
import DictionaryPage from "./pages/Dictionary";
import BookDetail from "./pages/BookDetail";
import Reader from "./pages/Reader";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function DarkModeSync() {
  const darkMode = useReadingProgressStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isReviewing = useFlashcardStore(s => s.isReviewing);
  const hideNav = location.pathname.startsWith('/reader/') || isReviewing;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Routes location={location}>
            <Route path="/" element={<Library />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reader/:id/:difficulty" element={<Reader />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
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
        <DarkModeSync />
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
