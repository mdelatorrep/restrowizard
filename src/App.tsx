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
import AdminLayout from "./layouts/AdminLayout";
import OnboardingGuard from "./components/guards/OnboardingGuard";
import RequireSuperAdmin from "./components/guards/RequireSuperAdmin";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Diagnosis from "./pages/Diagnosis";
import Events from "./pages/Events";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import CandidateDashboard from "./pages/CandidateDashboard";
import LearnHome from "./pages/learn/LearnHome";
import TrackDetail from "./pages/learn/TrackDetail";
import CourseDetail from "./pages/learn/CourseDetail";
import LessonViewer from "./pages/learn/LessonViewer";
import StudentDashboard from "./pages/learn/StudentDashboard";
import ServicesHome from "./pages/services/ServicesHome";
import ProviderDetail from "./pages/services/ProviderDetail";
import RequestDetail from "./pages/services/RequestDetail";
import ProviderDashboard from "./pages/services/ProviderDashboard";
import ProviderRegister from "./pages/services/ProviderRegister";
import Growth from "./pages/Growth";
import Menus from "./pages/Menus";
import PublicMenu from "./pages/PublicMenu";
import PublicFeedback from "./pages/PublicFeedback";
import PublicLoyalty from "./pages/PublicLoyalty";
import LoyaltyPortal from "./pages/LoyaltyPortal";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Restaurant pages
import RestaurantOnboarding from "./pages/restaurant/Onboarding";
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantFinances from "./pages/restaurant/Finances";
import RestaurantOperations from "./pages/restaurant/Operations";
import RestaurantTalent from "./pages/restaurant/Talent";
import RestaurantMenuEngineering from "./pages/restaurant/MenuEngineering";
import RestaurantSustainability from "./pages/restaurant/Sustainability";
import RestaurantSettings from "./pages/restaurant/Settings";
import RestaurantEcosystemAdmin from "./pages/restaurant/EcosystemAdmin";
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
import RestaurantFirst90Days from "./pages/restaurant/First90Days";
import RestaurantPreOpening from "./pages/restaurant/PreOpening";
import RestaurantPOS from "./pages/restaurant/POS";
import RestaurantKitchen from "./pages/restaurant/KitchenDisplay";
import RestaurantPOSReports from "./pages/restaurant/POSReports";
import RestaurantWebsite from "./pages/restaurant/Website";
import RestaurantReservations from "./pages/restaurant/Reservations";
import RestaurantStaffSchedule from "./pages/restaurant/StaffSchedule";
import RestaurantInventory from "./pages/restaurant/Inventory";
import RestaurantDelivery from "./pages/restaurant/Delivery";
import RestaurantSuppliers from "./pages/restaurant/Suppliers";
import RestaurantMyDevelopment from "./pages/restaurant/MyDevelopment";
import PublicRestaurant from "./pages/PublicRestaurant";
 import { Navigate } from "react-router-dom";
 
 // New unified public pages
 import PublicRestaurantHub from "./pages/public/PublicRestaurantHub";
 import PublicMenuPage from "./pages/public/PublicMenuPage";
 import PublicReservationsPage from "./pages/public/PublicReservationsPage";
 import PublicDeliveryPage from "./pages/public/PublicDeliveryPage";
 import PublicLoyaltyPage from "./pages/public/PublicLoyaltyPage";
 import PublicExperiencePage from "./pages/public/PublicExperiencePage";
 
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
import ConsultantClients from "./pages/consultant/Clients";
import ConsultantReports from "./pages/consultant/Reports";
import ConsultantAlerts from "./pages/consultant/Alerts";
import ConsultantNewBusiness from "./pages/consultant/NewBusiness";
import PublicQuotationPage from "./pages/PublicQuotation";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminLearn from "./pages/admin/AdminLearn";
import AdminServices from "./pages/admin/AdminServices";
import AdminGrowth from "./pages/admin/AdminGrowth";
import AdminSettings from "./pages/admin/AdminSettings";

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
              <Route path="/eventos" element={<Navigate to="/events" replace />} />
              <Route path="/casos-de-exito" element={<Navigate to="/#testimonios" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/jobs/mi-perfil" element={<CandidateDashboard />} />
              <Route path="/learn" element={<LearnHome />} />
              <Route path="/learn/track/:slug" element={<TrackDetail />} />
              <Route path="/learn/course/:id" element={<CourseDetail />} />
              <Route path="/learn/course/:id/lesson/:lessonId" element={<LessonViewer />} />
              <Route path="/learn/mi-progreso" element={<StudentDashboard />} />
              <Route path="/services" element={<ServicesHome />} />
              <Route path="/services/provider/:id" element={<ProviderDetail />} />
              <Route path="/services/request/:id" element={<RequestDetail />} />
              <Route path="/services/dashboard" element={<ProviderDashboard />} />
              <Route path="/services/register" element={<ProviderRegister />} />
              <Route path="/growth" element={<Growth />} />
              <Route path="/menus" element={<Menus />} />
              <Route path="/menu/:slug" element={<PublicMenu />} />

              {/* Unified public restaurant routes - using /p/ prefix for public */}
              <Route path="/p/:slug" element={<PublicRestaurantHub />} />
              <Route path="/p/:slug/menu" element={<PublicMenuPage />} />
              <Route path="/p/:slug/reservas" element={<PublicReservationsPage />} />
              <Route path="/p/:slug/domicilios" element={<PublicDeliveryPage />} />
              <Route path="/p/:slug/fidelidad" element={<PublicLoyaltyPage />} />
              <Route path="/p/:slug/experiencia" element={<PublicExperiencePage />} />

              {/* Legacy route - keep for backwards compatibility */}
              <Route path="/restaurante/:slug" element={<PublicRestaurant />} />

              <Route path="/feedback/:campaignId" element={<PublicFeedback />} />
              <Route path="/mi-fidelidad" element={<LoyaltyPortal />} />
              <Route path="/mi-fidelidad/:codigo" element={<PublicLoyalty />} />
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
                <Route index element={<RestaurantDashboard />} />
                <Route path="dashboard" element={<RestaurantDashboard />} />
                <Route path="finances" element={<RestaurantFinances />} />
                {/* Redirect operations to finances */}
                <Route path="operations" element={<Navigate to="/r/finances" replace />} />
                <Route path="talent" element={<RestaurantTalent />} />
                {/* Redirect menu-engineering to menus */}
                <Route path="menu-engineering" element={<Navigate to="/r/menus" replace />} />
                <Route path="sustainability" element={<RestaurantSustainability />} />
                <Route path="ghost-kitchen" element={<RestaurantGhostKitchen />} />
                <Route path="chain-management" element={<RestaurantChainManagement />} />
                <Route path="brand" element={<RestaurantBrand />} />
                <Route path="feedback" element={<RestaurantFeedback />} />
                <Route path="recipes" element={<RestaurantRecipes />} />
                <Route path="orders" element={<RestaurantOrders />} />
                {/* Redirect sales-goals to pos-reports */}
                <Route path="sales-goals" element={<Navigate to="/r/pos-reports?tab=goals" replace />} />
                <Route path="support" element={<RestaurantSupport />} />
                {/* Redirect social-listening to feedback */}
                <Route path="social-listening" element={<Navigate to="/r/feedback?mainTab=reputation" replace />} />
                <Route path="new-business" element={<RestaurantNewBusiness />} />
                <Route path="menus" element={<RestaurantMenus />} />
                <Route path="loyalty" element={<RestaurantLoyalty />} />
                <Route path="first-90-days" element={<RestaurantFirst90Days />} />
                <Route path="pre-opening" element={<RestaurantPreOpening />} />
                <Route path="pos" element={<RestaurantPOS />} />
                <Route path="pos-reports" element={<RestaurantPOSReports />} />
                <Route path="kitchen" element={<RestaurantKitchen />} />
                <Route path="website" element={<RestaurantWebsite />} />
                <Route path="reservations" element={<RestaurantReservations />} />
                {/* Redirect staff-schedule to talent */}
                <Route path="staff-schedule" element={<Navigate to="/r/talent?tab=schedule" replace />} />
                <Route path="inventory" element={<RestaurantInventory />} />
                <Route path="delivery" element={<RestaurantDelivery />} />
                {/* Redirect suppliers to inventory */}
                <Route path="suppliers" element={<Navigate to="/r/inventory?tab=suppliers" replace />} />
                <Route path="settings" element={<RestaurantSettings />} />
                <Route path="ecosystem-admin" element={<RestaurantEcosystemAdmin />} />
                <Route path="my-development" element={<RestaurantMyDevelopment />} />
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
                <Route path="clients" element={<ConsultantClients />} />
                <Route path="reports" element={<ConsultantReports />} />
                <Route path="alerts" element={<ConsultantAlerts />} />
                <Route path="new-business" element={<ConsultantNewBusiness />} />
                <Route path="billing" element={<ConsultantBilling />} />
                <Route path="settings" element={<ConsultantSettings />} />
              </Route>

              {/* Super Admin routes */}
              <Route path="/admin" element={
                <RequireSuperAdmin>
                  <AdminLayout />
                </RequireSuperAdmin>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="restaurants" element={<AdminRestaurants />} />
                <Route path="jobs" element={<AdminJobs />} />
                <Route path="learn" element={<AdminLearn />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="growth" element={<AdminGrowth />} />
                <Route path="settings" element={<AdminSettings />} />
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
