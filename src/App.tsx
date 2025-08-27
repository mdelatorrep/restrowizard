import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import InactivityManager from "./components/InactivityManager";
import InstallPWAPrompt from "./components/InstallPWAPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Diagnosis from "./pages/Diagnosis";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Jobs from "./pages/Jobs";
import Menus from "./pages/Menus";
import PublicMenu from "./pages/PublicMenu";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InactivityManager />
      <InstallPWAPrompt />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/menu/:slug" element={<PublicMenu />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
