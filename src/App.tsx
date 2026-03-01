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
import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
// Booking page now redirects to /bookings
import Bookings from "./pages/Bookings";
import Availability from "./pages/Availability";
import EventForm from "./pages/EventForm";
import PublicBooking from "./pages/PublicBooking";
import ProfileSettings from "./pages/ProfileSettings";
import GuestBookingManage from "./pages/GuestBookingManage";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import AppealVerify from "./pages/AppealVerify";
import About from "./pages/About";
import Events from "./pages/Events";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminAppeals from "./pages/admin/AdminAppeals";
import AdminBlockedLogs from "./pages/admin/AdminBlockedLogs";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOGImages from "./pages/admin/AdminOGImages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
