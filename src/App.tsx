import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";

// Legacy redirect: /restaurante/:slug → canonical /p/:slug (preserves sub-path)
function LegacyRestauranteRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/restaurante\/[^/]+/, '') || '';
  return <Navigate to={`/p/${slug}${rest}${search}${hash}`} replace />;
}
import { lazy, Suspense } from "react";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ActiveClientProvider } from "./contexts/ActiveClientContext";
import InactivityManager from "./components/InactivityManager";
import InstallPWAPrompt from "./components/InstallPWAPrompt";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import OnboardingGuard from "./components/guards/OnboardingGuard";
import RequireSuperAdmin from "./components/guards/RequireSuperAdmin";

import { RouteErrorBoundary } from "./components/errors/RouteErrorBoundary";
import { PageSkeleton } from "./components/ui/skeletons";

// Eager: critical landing/auth/SEO pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy: public marketing & secondary pages
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Diagnosis = lazy(() => import("./pages/Diagnosis"));
const Events = lazy(() => import("./pages/Events"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const CandidateDashboard = lazy(() => import("./pages/CandidateDashboard"));
const LearnHome = lazy(() => import("./pages/learn/LearnHome"));
const TrackDetail = lazy(() => import("./pages/learn/TrackDetail"));
const CourseDetail = lazy(() => import("./pages/learn/CourseDetail"));
const LessonViewer = lazy(() => import("./pages/learn/LessonViewer"));
const StudentDashboard = lazy(() => import("./pages/learn/StudentDashboard"));
const ServicesHome = lazy(() => import("./pages/services/ServicesHome"));
const ProviderDetail = lazy(() => import("./pages/services/ProviderDetail"));
const RequestDetail = lazy(() => import("./pages/services/RequestDetail"));
const ProviderDashboard = lazy(() => import("./pages/services/ProviderDashboard"));
const ProviderRegister = lazy(() => import("./pages/services/ProviderRegister"));
const Growth = lazy(() => import("./pages/Growth"));
const Menus = lazy(() => import("./pages/Menus"));
const PublicMenu = lazy(() => import("./pages/PublicMenu"));
const PublicFeedback = lazy(() => import("./pages/PublicFeedback"));
const PublicLoyalty = lazy(() => import("./pages/PublicLoyalty"));
const LoyaltyPortal = lazy(() => import("./pages/LoyaltyPortal"));
const PublicRestaurant = lazy(() => import("./pages/PublicRestaurant"));
const PublicQuotationPage = lazy(() => import("./pages/PublicQuotation"));

// Unified public restaurant pages
const PublicRestaurantHub = lazy(() => import("./pages/public/PublicRestaurantHub"));
const PublicMenuPage = lazy(() => import("./pages/public/PublicMenuPage"));
const PublicReservationsPage = lazy(() => import("./pages/public/PublicReservationsPage"));
const PublicDeliveryPage = lazy(() => import("./pages/public/PublicDeliveryPage"));
const PublicLoyaltyPage = lazy(() => import("./pages/public/PublicLoyaltyPage"));
const PublicExperiencePage = lazy(() => import("./pages/public/PublicExperiencePage"));

// Lazy: restaurant area
const RestaurantOnboarding = lazy(() => import("./pages/restaurant/Onboarding"));
const RestaurantDashboard = lazy(() => import("./pages/restaurant/Dashboard"));
const RestaurantFinances = lazy(() => import("./pages/restaurant/Finances"));
const RestaurantTalent = lazy(() => import("./pages/restaurant/Talent"));
const RestaurantSustainability = lazy(() => import("./pages/restaurant/Sustainability"));
const RestaurantSettings = lazy(() => import("./pages/restaurant/Settings"));
const RestaurantEcosystemAdmin = lazy(() => import("./pages/restaurant/EcosystemAdmin"));
const RestaurantGhostKitchen = lazy(() => import("./pages/restaurant/GhostKitchen"));
const RestaurantRappiIntegration = lazy(() => import("./pages/restaurant/integrations/Rappi"));
const RestaurantChainManagement = lazy(() => import("./pages/restaurant/ChainManagement"));
const RestaurantBrand = lazy(() => import("./pages/restaurant/Brand"));
const RestaurantFeedback = lazy(() => import("./pages/restaurant/Feedback"));
const RestaurantRecipes = lazy(() => import("./pages/restaurant/Recipes"));
const RestaurantOrders = lazy(() => import("./pages/restaurant/Orders"));
const RestaurantSupport = lazy(() => import("./pages/restaurant/Support"));
const RestaurantNewBusiness = lazy(() => import("./pages/restaurant/NewBusiness"));
const RestaurantMenus = lazy(() => import("./pages/restaurant/Menus"));
const RestaurantLoyalty = lazy(() => import("./pages/restaurant/Loyalty"));
const RestaurantFirst90Days = lazy(() => import("./pages/restaurant/First90Days"));
const RestaurantPreOpening = lazy(() => import("./pages/restaurant/PreOpening"));
const RestaurantPOS = lazy(() => import("./pages/restaurant/POS"));
const RestaurantKitchen = lazy(() => import("./pages/restaurant/KitchenDisplay"));
const RestaurantPOSReports = lazy(() => import("./pages/restaurant/POSReports"));
const RestaurantWebsite = lazy(() => import("./pages/restaurant/Website"));
const RestaurantReservations = lazy(() => import("./pages/restaurant/Reservations"));
const RestaurantInventory = lazy(() => import("./pages/restaurant/Inventory"));
const RestaurantDelivery = lazy(() => import("./pages/restaurant/Delivery"));
const RestaurantMyDevelopment = lazy(() => import("./pages/restaurant/MyDevelopment"));
const RestaurantKnowledge = lazy(() => import("./pages/restaurant/Knowledge"));
const RestaurantInvoices = lazy(() => import("./pages/restaurant/Invoices"));
const RestaurantElectronicInvoicing = lazy(() => import("./pages/restaurant/ElectronicInvoicing"));

// Lazy: standalone POS portal
const POSLogin = lazy(() => import("./pages/pos/POSLogin"));
const POSMain = lazy(() => import("./pages/pos/POSMain"));


// Lazy: consultant area
const ConsultantOnboarding = lazy(() => import("./pages/consultant/Onboarding"));
const ConsultantDashboard = lazy(() => import("./pages/consultant/Dashboard"));
const ConsultantFinances = lazy(() => import("./pages/consultant/Finances"));
const ConsultantOperations = lazy(() => import("./pages/consultant/Operations"));
const ConsultantTalent = lazy(() => import("./pages/consultant/Talent"));
const ConsultantMenuEngineering = lazy(() => import("./pages/consultant/MenuEngineering"));
const ConsultantSustainability = lazy(() => import("./pages/consultant/Sustainability"));
const ConsultantBilling = lazy(() => import("./pages/consultant/Billing"));
const ConsultantSettings = lazy(() => import("./pages/consultant/Settings"));
const ConsultantGhostKitchen = lazy(() => import("./pages/consultant/GhostKitchen"));
const ConsultantChainManagement = lazy(() => import("./pages/consultant/ChainManagement"));
const ConsultantEvents = lazy(() => import("./pages/consultant/Events"));
const ConsultantEventSpaces = lazy(() => import("./pages/consultant/EventSpaces"));
const ConsultantNewQuotation = lazy(() => import("./pages/consultant/NewQuotation"));
const ConsultantClients = lazy(() => import("./pages/consultant/Clients"));
const ConsultantReports = lazy(() => import("./pages/consultant/Reports"));
const ConsultantAlerts = lazy(() => import("./pages/consultant/Alerts"));
const ConsultantNewBusiness = lazy(() => import("./pages/consultant/NewBusiness"));

// Lazy: admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminLearn = lazy(() => import("./pages/admin/AdminLearn"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminGrowth = lazy(() => import("./pages/admin/AdminGrowth"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => <PageSkeleton />;

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
            <RouteErrorBoundary label="app">
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/diagnosis" element={<Diagnosis />} />
                <Route path="/events" element={<Events />} />
                <Route path="/eventos" element={<Navigate to="/events" replace />} />
                {/* Legacy redirect kept for old shared links — F-03 renamed nav to "Testimonios". */}
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

                {/* Unified public restaurant routes */}
                <Route path="/p/:slug" element={<PublicRestaurantHub />} />
                <Route path="/p/:slug/menu" element={<PublicMenuPage />} />
                <Route path="/p/:slug/reservas" element={<PublicReservationsPage />} />
                <Route path="/p/:slug/domicilios" element={<PublicDeliveryPage />} />
                <Route path="/p/:slug/fidelidad" element={<PublicLoyaltyPage />} />
                <Route path="/p/:slug/experiencia" element={<PublicExperiencePage />} />

                {/* Legacy alias → canonical public hub */}
                <Route path="/restaurante/:slug" element={<LegacyRestauranteRedirect />} />
                <Route path="/restaurante/:slug/*" element={<LegacyRestauranteRedirect />} />

                <Route path="/feedback/:campaignId" element={<PublicFeedback />} />
                <Route path="/mi-fidelidad" element={<LoyaltyPortal />} />
                <Route path="/mi-fidelidad/:codigo" element={<PublicLoyalty />} />
                <Route path="/cotizacion/:slug" element={<PublicQuotationPage />} />

                {/* Restaurant onboarding */}
                <Route path="/r/onboarding" element={
                  <OnboardingGuard requireOnboarding={false} userType="restaurant_owner">
                    <RestaurantOnboarding />
                  </OnboardingGuard>
                } />

                {/* Restaurant routes */}
                <Route path="/r" element={
                  <OnboardingGuard requireOnboarding={true} userType="restaurant_owner">
                    <AppLayout requiredUserType="restaurant_owner" />
                  </OnboardingGuard>
                }>
                  <Route index element={<RestaurantDashboard />} />
                  <Route path="dashboard" element={<RestaurantDashboard />} />
                  <Route path="finances" element={<RestaurantFinances />} />
                  <Route path="operations" element={<Navigate to="/r/finances" replace />} />
                  <Route path="talent" element={<RestaurantTalent />} />
                  <Route path="menu-engineering" element={<Navigate to="/r/menus" replace />} />
                  <Route path="sustainability" element={<RestaurantSustainability />} />
                  <Route path="ghost-kitchen" element={<RestaurantGhostKitchen />} />
                  <Route path="chain-management" element={<RestaurantChainManagement />} />
                  <Route path="brand" element={<RestaurantBrand />} />
                  <Route path="feedback" element={<RestaurantFeedback />} />
                  <Route path="recipes" element={<RestaurantRecipes />} />
                  <Route path="orders" element={<RestaurantOrders />} />
                  <Route path="sales-goals" element={<Navigate to="/r/pos-reports?tab=goals" replace />} />
                  <Route path="support" element={<RestaurantSupport />} />
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
                  <Route path="staff-schedule" element={<Navigate to="/r/talent?tab=schedule" replace />} />
                  <Route path="inventory" element={<RestaurantInventory />} />
                  <Route path="delivery" element={<RestaurantDelivery />} />
                  <Route path="integrations/rappi" element={<RestaurantRappiIntegration />} />
                  <Route path="suppliers" element={<Navigate to="/r/inventory?tab=suppliers" replace />} />
                  <Route path="settings" element={<RestaurantSettings />} />
                  <Route path="ecosystem-admin" element={<RestaurantEcosystemAdmin />} />
                  <Route path="my-development" element={<RestaurantMyDevelopment />} />
                  <Route path="knowledge" element={<RestaurantKnowledge />} />
                  <Route path="invoices" element={<RestaurantInvoices />} />
                  <Route path="electronic-invoicing" element={<RestaurantElectronicInvoicing />} />
                </Route>

                {/* Consultant onboarding */}
                <Route path="/c/onboarding" element={
                  <OnboardingGuard requireOnboarding={false} userType="consultant">
                    <ConsultantOnboarding />
                  </OnboardingGuard>
                } />

                {/* Consultant routes */}
                <Route path="/c" element={
                  <OnboardingGuard requireOnboarding={true} userType="consultant">
                    <AppLayout requiredUserType="consultant" />
                  </OnboardingGuard>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<ConsultantDashboard />} />
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

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </RouteErrorBoundary>
          </ActiveClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
