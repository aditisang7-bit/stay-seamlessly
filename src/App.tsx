import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import BuyerDashboard from "@/pages/BuyerDashboard";
import SellerDashboard from "@/pages/SellerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import PropertyCheckerDashboard from "@/pages/PropertyCheckerDashboard";
import FavoritesPage from "@/pages/FavoritesPage";
import PunePage from "@/pages/PunePage";
import AreaPage from "@/pages/AreaPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/buyer" element={<RouteGuard allowedRoles={['buyer', 'seller', 'admin', 'super_admin']}><BuyerDashboard /></RouteGuard>} />
            <Route path="/seller" element={<RouteGuard allowedRoles={['seller', 'admin', 'super_admin']}><SellerDashboard /></RouteGuard>} />
            <Route path="/admin" element={<RouteGuard allowedRoles={['admin', 'super_admin']}><AdminDashboard /></RouteGuard>} />
            <Route path="/super-admin" element={<RouteGuard allowedRoles={['super_admin']}><SuperAdminDashboard /></RouteGuard>} />
            <Route path="/checker" element={<RouteGuard allowedRoles={['property_checker', 'super_admin']}><PropertyCheckerDashboard /></RouteGuard>} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/rent/pune" element={<PunePage />} />
            <Route path="/rent/pune/:area" element={<AreaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
