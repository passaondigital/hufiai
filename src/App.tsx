import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import Projects from "./pages/Projects";
import Knowledge from "./pages/Knowledge";
import Pricing from "./pages/Pricing";
import SettingsPage from "./pages/SettingsPage";
import Admin from "./pages/Admin";
import CompanySettings from "./pages/CompanySettings";
import ContentHub from "./pages/ContentHub";
import MyHorses from "./pages/MyHorses";
import Roadmap from "./pages/Roadmap";
import FounderCoach from "./pages/FounderCoach";
import Support from "./pages/Support";
import ProProfile from "./pages/ProProfile";
import ExpertDashboard from "./pages/ExpertDashboard";
import Impressum from "./pages/Impressum";
import AGB from "./pages/AGB";
import Datenschutz from "./pages/Datenschutz";
import ExpertenSuche from "./pages/ExpertenSuche";
import Manual from "./pages/Manual";
import AdminDocs from "./pages/AdminDocs";
import UeberHufiai from "./pages/UeberHufiai";
import EthikSeite from "./pages/EthikSeite";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/landing" replace />;

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Konto gesperrt</h1>
          <p className="text-muted-foreground">Dein Konto wurde gesperrt. Bitte kontaktiere den Support.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={user ? <Navigate to="/" replace /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" replace />} />
      <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
      <Route path="/horses" element={<ProtectedRoute><MyHorses /></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
      <Route path="/content" element={<ProtectedRoute><ContentHub /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
      <Route path="/founder-coach" element={<ProtectedRoute><FounderCoach /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/pro-profile" element={<ProtectedRoute><ProProfile /></ProtectedRoute>} />
      <Route path="/expert-dashboard" element={<ProtectedRoute><ExpertDashboard /></ProtectedRoute>} />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/agb" element={<AGB />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
      <Route path="/experten" element={<ExpertenSuche />} />
      <Route path="/manual" element={<Manual />} />
      <Route path="/admin/docs" element={<ProtectedRoute><AdminDocs /></ProtectedRoute>} />
      <Route path="/ueber-hufiai" element={<UeberHufiai />} />
      <Route path="/ethik" element={<EthikSeite />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
