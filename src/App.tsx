import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Library from "./pages/Library";
import MyBooks from "./pages/MyBooks";
import Flashcards from "./pages/Flashcards";
import DictionaryPage from "./pages/Dictionary";
import BookDetail from "./pages/BookDetail";
import Reader from "./pages/Reader";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/reader/');

  return (
    <>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/my-books" element={<MyBooks />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/dictionary" element={<DictionaryPage />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/reader/:id/:difficulty" element={<Reader />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
