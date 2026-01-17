import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ActiveClientProvider } from "./contexts/ActiveClientContext";
import InactivityManager from "./components/InactivityManager";
import InstallPWAPrompt from "./components/InstallPWAPrompt";
import AppLayout from "./layouts/AppLayout";
import OnboardingGuard from "./components/guards/OnboardingGuard";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Diagnosis from "./pages/Diagnosis";
import Events from "./pages/Events";
import Jobs from "./pages/Jobs";
import Menus from "./pages/Menus";
import PublicMenu from "./pages/PublicMenu";
import PublicFeedback from "./pages/PublicFeedback";
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
import RestaurantGhostKitchen from "./pages/restaurant/GhostKitchen";
import RestaurantChainManagement from "./pages/restaurant/ChainManagement";
import RestaurantBrand from "./pages/restaurant/Brand";
import RestaurantFeedback from "./pages/restaurant/Feedback";
import RestaurantRecipes from "./pages/restaurant/Recipes";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantSalesGoals from "./pages/restaurant/SalesGoals";
import RestaurantSupport from "./pages/restaurant/Support";
import RestaurantSocialListening from "./pages/restaurant/SocialListening";
import RestaurantNewBusiness from "./pages/restaurant/NewBusiness";
import RestaurantMenus from "./pages/restaurant/Menus";
import RestaurantLoyalty from "./pages/restaurant/Loyalty";

// Consultant pages
import ConsultantOnboarding from "./pages/consultant/Onboarding";
import ConsultantDashboard from "./pages/consultant/Dashboard";
import ConsultantFinances from "./pages/consultant/Finances";
import ConsultantOperations from "./pages/consultant/Operations";
import ConsultantTalent from "./pages/consultant/Talent";
import ConsultantMenuEngineering from "./pages/consultant/MenuEngineering";
import ConsultantSustainability from "./pages/consultant/Sustainability";
import ConsultantBilling from "./pages/consultant/Billing";
import ConsultantSettings from "./pages/consultant/Settings";
import ConsultantGhostKitchen from "./pages/consultant/GhostKitchen";
import ConsultantChainManagement from "./pages/consultant/ChainManagement";
import ConsultantEvents from "./pages/consultant/Events";
import ConsultantEventSpaces from "./pages/consultant/EventSpaces";
import ConsultantNewQuotation from "./pages/consultant/NewQuotation";
import PublicQuotationPage from "./pages/PublicQuotation";

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
          <ActiveClientProvider>
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
              <Route path="/feedback/:campaignId" element={<PublicFeedback />} />
              <Route path="/cotizacion/:slug" element={<PublicQuotationPage />} />

              {/* Restaurant onboarding (requires NOT having completed onboarding) */}
              <Route path="/r/onboarding" element={
                <OnboardingGuard requireOnboarding={false} userType="restaurant_owner">
                  <RestaurantOnboarding />
                </OnboardingGuard>
              } />

              {/* Restaurant routes (requires completed onboarding) */}
              <Route path="/r" element={
                <OnboardingGuard requireOnboarding={true} userType="restaurant_owner">
                  <AppLayout requiredUserType="restaurant_owner" />
                </OnboardingGuard>
              }>
              <Route path="dashboard" element={<RestaurantDashboard />} />
                <Route path="finances" element={<RestaurantFinances />} />
                <Route path="operations" element={<RestaurantOperations />} />
                <Route path="talent" element={<RestaurantTalent />} />
                <Route path="menu-engineering" element={<RestaurantMenuEngineering />} />
                <Route path="sustainability" element={<RestaurantSustainability />} />
                <Route path="ghost-kitchen" element={<RestaurantGhostKitchen />} />
                <Route path="chain-management" element={<RestaurantChainManagement />} />
                <Route path="brand" element={<RestaurantBrand />} />
                <Route path="feedback" element={<RestaurantFeedback />} />
                <Route path="recipes" element={<RestaurantRecipes />} />
                <Route path="orders" element={<RestaurantOrders />} />
                <Route path="sales-goals" element={<RestaurantSalesGoals />} />
                <Route path="support" element={<RestaurantSupport />} />
                <Route path="social-listening" element={<RestaurantSocialListening />} />
                <Route path="new-business" element={<RestaurantNewBusiness />} />
                <Route path="menus" element={<RestaurantMenus />} />
                <Route path="loyalty" element={<RestaurantLoyalty />} />
                <Route path="settings" element={<RestaurantSettings />} />
              </Route>

              {/* Consultant onboarding (requires NOT having completed onboarding) */}
              <Route path="/c/onboarding" element={
                <OnboardingGuard requireOnboarding={false} userType="consultant">
                  <ConsultantOnboarding />
                </OnboardingGuard>
              } />

              {/* Consultant routes (requires completed onboarding) */}
              <Route path="/c" element={
                <OnboardingGuard requireOnboarding={true} userType="consultant">
                  <AppLayout requiredUserType="consultant" />
                </OnboardingGuard>
              }>
                <Route path="dashboard" element={<ConsultantDashboard />} />
                
                {/* AI Tools for clients */}
                <Route path="finances" element={<ConsultantFinances />} />
                <Route path="operations" element={<ConsultantOperations />} />
                <Route path="talent" element={<ConsultantTalent />} />
                <Route path="menu-engineering" element={<ConsultantMenuEngineering />} />
                <Route path="sustainability" element={<ConsultantSustainability />} />
                <Route path="ghost-kitchen" element={<ConsultantGhostKitchen />} />
                <Route path="chain-management" element={<ConsultantChainManagement />} />
                <Route path="events" element={<ConsultantEvents />} />
                <Route path="events/spaces" element={<ConsultantEventSpaces />} />
                <Route path="events/new" element={<ConsultantNewQuotation />} />
                
                {/* Consultant management */}
                <Route path="billing" element={<ConsultantBilling />} />
                <Route path="settings" element={<ConsultantSettings />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ActiveClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
