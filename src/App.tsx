import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard, PublicRoute } from "@/components/RouteGuard";
import { ComplianceGate } from "@/components/ComplianceGate";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import DealsPage from "./pages/DealsPage";
import MessagesPage from "./pages/MessagesPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import ListingsPage from "./pages/ListingsPage";
import StreamersPage from "./pages/StreamersPage";
import StreamerDetailPage from "./pages/StreamerDetailPage";
import { AdminVerificationsPage, AdminUsersPage, AdminAuditPage } from "./pages/AdminPages";
import { TermsPage, PrivacyPage, CompliancePage } from "./pages/LegalPages";
import ContractPage from "./pages/ContractPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
