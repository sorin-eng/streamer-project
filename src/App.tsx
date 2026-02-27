import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard, PublicRoute } from "@/components/RouteGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import DealsPage from "./pages/DealsPage";
import MessagesPage from "./pages/MessagesPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import { AdminVerificationsPage, AdminUsersPage, AdminAuditPage } from "./pages/AdminPages";
import { TermsPage, PrivacyPage, CompliancePage } from "./pages/LegalPages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/dashboard" element={<RouteGuard><DashboardPage /></RouteGuard>} />
            <Route path="/campaigns" element={<RouteGuard><CampaignsPage /></RouteGuard>} />
            <Route path="/deals" element={<RouteGuard><DealsPage /></RouteGuard>} />
            <Route path="/messages" element={<RouteGuard><MessagesPage /></RouteGuard>} />
            <Route path="/reports" element={<RouteGuard><ReportsPage /></RouteGuard>} />
            <Route path="/profile" element={<RouteGuard allowedRoles={['casino', 'streamer']}><ProfilePage /></RouteGuard>} />
            <Route path="/admin/verifications" element={<RouteGuard allowedRoles={['admin']}><AdminVerificationsPage /></RouteGuard>} />
            <Route path="/admin/users" element={<RouteGuard allowedRoles={['admin']}><AdminUsersPage /></RouteGuard>} />
            <Route path="/admin/audit" element={<RouteGuard allowedRoles={['admin']}><AdminAuditPage /></RouteGuard>} />
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
