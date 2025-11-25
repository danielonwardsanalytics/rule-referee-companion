import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SkipLink } from "./components/SkipLink";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BottomNav } from "./components/BottomNav";
import { MenuOverlay } from "./components/MenuOverlay";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Tournaments from "./pages/Tournaments";
import CreateTournament from "./pages/CreateTournament";
import TournamentDetail from "./pages/TournamentDetail";
import GameDetail from "./pages/GameDetail";
import HouseRules from "./pages/HouseRules";
import HouseRuleDetail from "./pages/HouseRuleDetail";
import PublicHouseRules from "./pages/PublicHouseRules";
import Friends from "./pages/Friends";
import GameRequests from "./pages/GameRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SkipLink />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Home />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <>
                    <Settings />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments"
              element={
                <ProtectedRoute>
                  <>
                    <Tournaments />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/create"
              element={
                <ProtectedRoute>
                  <>
                    <CreateTournament />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournament/:tournamentId"
              element={
                <ProtectedRoute>
                  <>
                    <TournamentDetail />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:gameId"
              element={
                <ProtectedRoute>
                  <>
                    <GameDetail />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/house-rules"
              element={
                <ProtectedRoute>
                  <>
                    <HouseRules />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/house-rules/:ruleSetId"
              element={
                <ProtectedRoute>
                  <>
                    <HouseRuleDetail />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <>
                    <Friends />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/public-house-rules"
              element={
                <ProtectedRoute>
                  <>
                    <PublicHouseRules />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/game-requests"
              element={
                <ProtectedRoute>
                  <>
                    <GameRequests />
                    <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
                    <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  </>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
