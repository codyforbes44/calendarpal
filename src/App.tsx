import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import GeoAccessGuard from "@/components/GeoAccessGuard";
import ScrollToTop from "@/components/ScrollToTop";

// Eagerly load the landing page for LCP
import Index from "./pages/Index";

// Lazy-load all other pages for reduced initial bundle
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Availability = lazy(() => import("./pages/Availability"));
const EventForm = lazy(() => import("./pages/EventForm"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const GuestBookingManage = lazy(() => import("./pages/GuestBookingManage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Support = lazy(() => import("./pages/Support"));
const AppealVerify = lazy(() => import("./pages/AppealVerify"));
const About = lazy(() => import("./pages/About"));
const Events = lazy(() => import("./pages/Events"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmbedBooking = lazy(() => import("./pages/EmbedBooking"));
const BookingPaymentSuccess = lazy(() => import("./pages/BookingPaymentSuccess"));
const Clients = lazy(() => import("./pages/Clients"));

// Admin pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminAppeals = lazy(() => import("./pages/admin/AdminAppeals"));
const AdminBlockedLogs = lazy(() => import("./pages/admin/AdminBlockedLogs"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminOGImages = lazy(() => import("./pages/admin/AdminOGImages"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback to avoid CLS
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <GeoAccessGuard>
            <TooltipProvider>
              <AuthProvider>
                <OnboardingProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/get-started" element={<GetStarted />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/update-password" element={<UpdatePassword />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/booking" element={<Navigate to="/bookings" replace />} />
                    <Route path="/book/:username" element={<PublicBooking />} />
                    <Route path="/book/:username/:eventSlug" element={<PublicBooking />} />
                    <Route path="/embed/:username" element={<EmbedBooking />} />
                    <Route path="/booking-payment-success" element={<BookingPaymentSuccess />} />
                    <Route path="/booking/:bookingId/manage" element={<GuestBookingManage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookings"
                      element={
                        <ProtectedRoute>
                          <Bookings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/availability"
                      element={
                        <ProtectedRoute>
                          <Availability />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/events/new"
                      element={
                        <ProtectedRoute>
                          <EventForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/events/:id"
                      element={
                        <ProtectedRoute>
                          <EventForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscription"
                      element={
                        <ProtectedRoute>
                          <Subscription />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/events"
                      element={
                        <ProtectedRoute>
                          <Events />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/clients"
                      element={
                        <ProtectedRoute>
                          <Clients />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/appeal/verify" element={<AppealVerify />} />
                    
                    {/* Admin routes with nested layout - protected by AdminRouteGuard */}
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRouteGuard>
                          <AdminLayout />
                        </AdminRouteGuard>
                      }
                    >
                      <Route index element={<AdminOverview />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="roles" element={<AdminRoles />} />
                      <Route path="bookings" element={<AdminBookings />} />
                      <Route path="appeals" element={<AdminAppeals />} />
                      <Route path="logs" element={<AdminBlockedLogs />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="og-images" element={<AdminOGImages />} />
                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </BrowserRouter>
                </OnboardingProvider>
              </AuthProvider>
            </TooltipProvider>
          </GeoAccessGuard>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;