import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { RouteGuard, PublicRoute } from "@/components/RouteGuard";
import { ComplianceGate } from "@/components/ComplianceGate";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const StreamersPage = lazy(() => import("./pages/StreamersPage"));
const StreamerDetailPage = lazy(() => import("./pages/StreamerDetailPage"));
const ContractPage = lazy(() => import("./pages/ContractPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminVerificationsPage = lazy(() => import("./pages/AdminPages").then((m) => ({ default: m.AdminVerificationsPage })));
const AdminUsersPage = lazy(() => import("./pages/AdminPages").then((m) => ({ default: m.AdminUsersPage })));
const AdminAuditPage = lazy(() => import("./pages/AdminPages").then((m) => ({ default: m.AdminAuditPage })));
const TermsPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.PrivacyPage })));
const CompliancePage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.CompliancePage })));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="castreamino-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                  <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/dashboard" element={<RouteGuard><ComplianceGate><DashboardPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/campaigns" element={<RouteGuard><ComplianceGate><CampaignsPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/deals" element={<RouteGuard><ComplianceGate><DealsPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/messages" element={<RouteGuard><ComplianceGate><MessagesPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/reports" element={<RouteGuard><ComplianceGate><ReportsPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/profile" element={<RouteGuard allowedRoles={['casino_manager', 'streamer']}><ComplianceGate><ProfilePage /></ComplianceGate></RouteGuard>} />
                  <Route path="/settings" element={<RouteGuard allowedRoles={['casino_manager', 'streamer']}><ComplianceGate><SettingsPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/listings" element={<RouteGuard allowedRoles={['streamer']}><ComplianceGate><ListingsPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/streamers" element={<RouteGuard allowedRoles={['casino_manager', 'admin']}><ComplianceGate><StreamersPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/streamers/:id" element={<RouteGuard allowedRoles={['casino_manager', 'admin']}><ComplianceGate><StreamerDetailPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/admin/verifications" element={<RouteGuard allowedRoles={['admin']}><AdminVerificationsPage /></RouteGuard>} />
                  <Route path="/admin/users" element={<RouteGuard allowedRoles={['admin']}><AdminUsersPage /></RouteGuard>} />
                  <Route path="/admin/audit" element={<RouteGuard allowedRoles={['admin']}><AdminAuditPage /></RouteGuard>} />
                  <Route path="/contracts" element={<RouteGuard><ComplianceGate requireKyc><ContractPage /></ComplianceGate></RouteGuard>} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/compliance" element={<CompliancePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
