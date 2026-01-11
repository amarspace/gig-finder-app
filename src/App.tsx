import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { PlaylistProvider } from "@/contexts/PlaylistContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Import from "./pages/Import";
import Results from "./pages/Results";
import GigDetail from "./pages/GigDetail";
import SectionList from "./pages/SectionList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserSettingsProvider>
            <PlaylistProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/import" element={<Import />} />
                <Route path="/results" element={<Results />} />
                <Route path="/gig/:id" element={<GigDetail />} />
                <Route path="/section/:section" element={<SectionList />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PlaylistProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
