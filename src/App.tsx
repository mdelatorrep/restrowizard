import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import InactivityManager from "./components/InactivityManager";
import InstallPWAPrompt from "./components/InstallPWAPrompt";
import AppLayout from "./layouts/AppLayout";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Diagnosis from "./pages/Diagnosis";
import Events from "./pages/Events";
import Jobs from "./pages/Jobs";
import Menus from "./pages/Menus";
import PublicMenu from "./pages/PublicMenu";
import NotFound from "./pages/NotFound";

// Restaurant pages
import RestaurantOnboarding from "./pages/restaurant/Onboarding";
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantFinances from "./pages/restaurant/Finances";
import RestaurantOperations from "./pages/restaurant/Operations";
import RestaurantTalent from "./pages/restaurant/Talent";
import RestaurantMenuEngineering from "./pages/restaurant/MenuEngineering";
import RestaurantSustainability from "./pages/restaurant/Sustainability";
import RestaurantSettings from "./pages/restaurant/Settings";

// Consultant pages
import ConsultantOnboarding from "./pages/consultant/Onboarding";
import ConsultantDashboard from "./pages/consultant/Dashboard";
import ConsultantClients from "./pages/consultant/Clients";
import ConsultantAlerts from "./pages/consultant/Alerts";
import ConsultantReports from "./pages/consultant/Reports";
import ConsultantBilling from "./pages/consultant/Billing";
import ConsultantSettings from "./pages/consultant/Settings";

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
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/menu/:slug" element={<PublicMenu />} />

            {/* Restaurant onboarding (outside layout) */}
            <Route path="/r/onboarding" element={<RestaurantOnboarding />} />

            {/* Restaurant routes (with layout) */}
            <Route path="/r" element={<AppLayout requiredUserType="restaurant_owner" />}>
              <Route path="dashboard" element={<RestaurantDashboard />} />
              <Route path="finances" element={<RestaurantFinances />} />
              <Route path="operations" element={<RestaurantOperations />} />
              <Route path="talent" element={<RestaurantTalent />} />
              <Route path="menu-engineering" element={<RestaurantMenuEngineering />} />
              <Route path="sustainability" element={<RestaurantSustainability />} />
              <Route path="settings" element={<RestaurantSettings />} />
            </Route>

            {/* Consultant onboarding (outside layout) */}
            <Route path="/c/onboarding" element={<ConsultantOnboarding />} />

            {/* Consultant routes (with layout) */}
            <Route path="/c" element={<AppLayout requiredUserType="consultant" />}>
              <Route path="dashboard" element={<ConsultantDashboard />} />
              <Route path="clients" element={<ConsultantClients />} />
              <Route path="alerts" element={<ConsultantAlerts />} />
              <Route path="reports" element={<ConsultantReports />} />
              <Route path="billing" element={<ConsultantBilling />} />
              <Route path="settings" element={<ConsultantSettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
