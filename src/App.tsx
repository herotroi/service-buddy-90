import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { SectorProvider } from "@/hooks/useSector";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import ServiceOrders from "./pages/ServiceOrders";
import Employees from "./pages/Employees";
import Situations from "./pages/Situations";
import WithdrawalSituations from "./pages/WithdrawalSituations";
import LocalEquipamento from "./pages/LocalEquipamento";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TrackingOS from "./pages/TrackingOS";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SectorProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              {/* Public tracking route - no auth required */}
              <Route path="/acompanhar/:token" element={<TrackingOS />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ServiceOrders />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/funcionarios"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Employees />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/situacoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Situations />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retirada"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WithdrawalSituations />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/local-equipamento"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LocalEquipamento />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SectorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
